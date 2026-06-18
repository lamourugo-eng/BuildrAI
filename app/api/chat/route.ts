import { hasCoachAccess } from '@/lib/account/coach-access';
import { resolveUserSubscription } from '@/lib/account/subscription-resolution';
import { PLAN_COOKIE, SUBSCRIPTION_COOKIE } from '@/lib/admin';
import { trimChatHistoryForModel } from '@/lib/coach/chat-history';
import {
  COACH_BUDGET_ERROR_CODE,
  coachBudgetExceededMessage,
} from '@/lib/coach/token-budget';
import {
  canUseCoachBudget,
  isMissingCoachTokenUsageTable,
  recordCoachTokenUsage,
} from '@/lib/coach/token-usage';
import { enrichCoachReply } from '@/lib/coach/enrich-reply';
import { resolveContextualTools } from '@/lib/coach/contextual-tools';
import { parseCoachValidatedActionIndices, appendInferredCoachValidations } from '@/lib/coach/roadmap-task-sync';
import {
  buildCoachProgressionReminderConcise,
  buildCoachQaReminderConcise,
} from '@/lib/coach/concise-style';
import type { CoachInteractionMode } from '@/lib/coach/interaction-mode';
import {
  detectCoachInteractionMode,
} from '@/lib/coach/interaction-mode';
import {
  appendProductExchange,
  isMissingTableError,
  loadProductMemory,
  toMemoryContext,
} from '@/lib/coach/product-memory';
import {
  getRecommendedToolSummary,
  resolveCoachingPhase,
} from '@/lib/coach/plan-builder';
import { truncateNotepadForPrompt } from '@/lib/coach/prompt-memory';
import { detectRoadmapDayInMessage, getRoadmapDayForCoach } from '@/lib/coach/resolve-roadmap-day';
import {
  buildRoadmapCoachReminder,
  parseRoadmapCoachContext,
} from '@/lib/coach/roadmap-coach-context';
import {
  buildCoachSystemPrompt,
  getCoachModel,
  getOpenAI,
  type CoachMemoryContext,
} from '@/lib/openai';
import type { BusinessId } from '@/lib/quiz/data';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';
import { createClient } from '@/lib/supabase/server';
import type { PlanId } from '@/lib/stripe';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

type ChatRole = 'user' | 'assistant';

interface IncomingMessage {
  role: ChatRole;
  content: string;
}

const VALID_BUSINESS_IDS = new Set([
  'saas',
  'freelance',
  'ecommerce',
  'agency',
  'marketplace',
  'impact',
  'consulting',
  'content',
  'ofm',
]);

function buildCoachReminder(
  phase: number,
  businessId: BusinessId | null,
  techLevel?: string,
  roadmapContext?: ReturnType<typeof parseRoadmapCoachContext>,
  interactionMode: ReturnType<typeof detectCoachInteractionMode> = 'progression',
  completedRoadmapTaskIndices: number[] = []
): string {
  if (roadmapContext) {
    return buildRoadmapCoachReminder(roadmapContext, completedRoadmapTaskIndices);
  }
  if (interactionMode === 'question') {
    return buildCoachQaReminderConcise();
  }
  const toolHint =
    businessId && phase >= 4
      ? ` Outil : ${getRecommendedToolSummary(businessId, techLevel).primary}.`
      : '';
  return buildCoachProgressionReminderConcise(toolHint);
}

function resolveRoadmapContextForRequest(
  userText: string,
  businessId: BusinessId | null | undefined,
  explicitContext: ReturnType<typeof parseRoadmapCoachContext>,
  planLinked: boolean
): ReturnType<typeof parseRoadmapCoachContext> {
  if (!businessId) return planLinked ? (explicitContext ?? null) : null;

  const detectedDay = detectRoadmapDayInMessage(userText);
  if (detectedDay != null) {
    const resolved = getRoadmapDayForCoach(businessId, detectedDay);
    if (resolved) return resolved;
  }

  if (!planLinked) return null;
  return explicitContext ?? null;
}

function resolveInteractionModeForRequest(
  userText: string,
  roadmapContext: ReturnType<typeof parseRoadmapCoachContext>,
  clientMode: unknown
): CoachInteractionMode {
  if (roadmapContext) return 'question';
  if (clientMode === 'question' || clientMode === 'progression') {
    return clientMode;
  }
  return detectCoachInteractionMode(userText);
}

function parseCompletedRoadmapTaskIndices(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((index): index is number => Number.isFinite(index) && index >= 0);
}

/**
 * Coach IA BuildrAI.
 * Connecté : { message, businessId, profile, roadmapContext?, roadmapCompletedTasks?, notepadSnippet? }
 * Anonyme : { messages[], profile, memory, roadmapContext?, notepadSnippet? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profile = body.profile as QuizProfileSnapshot | null | undefined;
    const clientMemory = body.memory as CoachMemoryContext | null | undefined;
    const parsedRoadmapContext = parseRoadmapCoachContext(body.roadmapContext);
    const planLinked = body.coachPlanLinked === true;
    const explicitRoadmapContext = planLinked ? parsedRoadmapContext : null;
    const roadmapCompletedTasks = parseCompletedRoadmapTaskIndices(body.roadmapCompletedTasks);
    const notepadSnippet = truncateNotepadForPrompt(
      typeof body.notepadSnippet === 'string' ? body.notepadSnippet : ''
    );

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!(await hasCoachAccess(user?.email))) {
      return NextResponse.json(
        { error: 'Abonnement requis pour accéder au coach IA.' },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    let planId: PlanId = 'starter';
    if (user) {
      const resolved = await resolveUserSubscription(
        supabase,
        user.id,
        user.email,
        cookieStore.get(SUBSCRIPTION_COOKIE)?.value,
        cookieStore.get(PLAN_COOKIE)?.value
      );
      planId = resolved.planId ?? 'starter';

      const budgetSnapshot = await canUseCoachBudget(supabase, user.id, planId);
      if (budgetSnapshot.limitReached) {
        return NextResponse.json(
          {
            error: coachBudgetExceededMessage(budgetSnapshot),
            code: COACH_BUDGET_ERROR_CODE,
          },
          { status: 429 }
        );
      }
    }

    const businessId = body.businessId as string | undefined;
    const singleMessage = body.message as string | undefined;
    const validBusinessId =
      businessId && VALID_BUSINESS_IDS.has(businessId) ? (businessId as BusinessId) : null;

    const useProductMemory =
      Boolean(user) && Boolean(validBusinessId) && Boolean(singleMessage?.trim());

    let messages: IncomingMessage[] | undefined = body.messages as IncomingMessage[] | undefined;
    let memoryContext: CoachMemoryContext | null | undefined = clientMemory;

    if (useProductMemory && user && validBusinessId && singleMessage?.trim()) {
      const existing = await loadProductMemory(supabase, user.id, validBusinessId);
      const history =
        existing?.messages.map((m) => ({
          role: m.role as ChatRole,
          content: m.content,
        })) ?? [];

      messages = [...history, { role: 'user', content: singleMessage.trim() }];
      memoryContext = existing ? toMemoryContext(existing) : clientMemory;
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Message ou historique requis.' },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user' || !lastMessage.content?.trim()) {
      return NextResponse.json(
        { error: 'Le dernier message doit être un message utilisateur non vide.' },
        { status: 400 }
      );
    }

    const userText = lastMessage.content.trim();
    const roadmapContext = resolveRoadmapContextForRequest(
      userText,
      validBusinessId ?? profile?.topBusinessId ?? null,
      explicitRoadmapContext,
      planLinked
    );
    const interactionMode = resolveInteractionModeForRequest(
      userText,
      roadmapContext,
      body.coachInteractionMode
    );

    const openai = getOpenAI();

    const trimmedHistory = trimChatHistoryForModel(messages.slice(0, -1));
    const history: ChatCompletionMessageParam[] = trimmedHistory.map((m) => ({
      role: m.role,
      content: m.content.trim(),
    }));

    const reminderPhase = resolveCoachingPhase(
      '',
      memoryContext?.coachingPhase,
      userText
    );

    const completionMessages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: buildCoachSystemPrompt(
          profile,
          memoryContext ?? null,
          roadmapContext,
          notepadSnippet || undefined,
          interactionMode,
          roadmapCompletedTasks
        ),
      },
      ...history,
      {
        role: 'user',
        content: `${userText}\n\n${buildCoachReminder(
          reminderPhase,
          validBusinessId,
          profile?.techLevel,
          roadmapContext,
          interactionMode,
          roadmapCompletedTasks
        )}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: getCoachModel(),
      messages: completionMessages,
      temperature: roadmapContext || interactionMode === 'question' ? 0.45 : 0.35,
      max_tokens:
        roadmapContext || interactionMode === 'question' ? 1400 : 1100,
      presence_penalty: 0.15,
      frequency_penalty: 0.35,
    });

    const rawReply = completion.choices[0]?.message?.content?.trim();
    if (!rawReply) {
      return NextResponse.json({ error: 'Réponse vide de OpenAI.' }, { status: 502 });
    }

    if (user && completion.usage) {
      try {
        await recordCoachTokenUsage(
          supabase,
          user.id,
          planId,
          getCoachModel(),
          completion.usage
        );
      } catch (usageErr) {
        const usageMessage = usageErr instanceof Error ? usageErr.message : '';
        if (!isMissingCoachTokenUsageTable(usageMessage)) {
          console.error('[coach] token usage record failed', usageMessage);
        }
      }
    }

    let reply = enrichCoachReply(rawReply, {
      businessId: validBusinessId ?? profile?.topBusinessId,
      techLevel: profile?.techLevel,
      coachingPhase: memoryContext?.coachingPhase,
      coachingStepLabel: memoryContext?.coachingStepLabel,
      userMessage: userText,
      roadmapContext,
      interactionMode,
    });

    if (roadmapContext && planLinked) {
      reply = appendInferredCoachValidations(
        reply,
        userText,
        roadmapContext.tasks,
        roadmapCompletedTasks
      );
    }

    const coachingPhase = roadmapContext
      ? memoryContext?.coachingPhase ?? 1
      : resolveCoachingPhase(reply, memoryContext?.coachingPhase, userText);
    const recommendedTool =
      validBusinessId ?? profile?.topBusinessId
        ? getRecommendedToolSummary(
            (validBusinessId ?? profile?.topBusinessId) as BusinessId,
            profile?.techLevel
          )
        : null;

    const contextualTools = resolveContextualTools({
      userMessage: userText,
      reply,
      businessId: validBusinessId ?? profile?.topBusinessId ?? null,
      techLevel: profile?.techLevel,
      coachingPhase,
    });

    let savedMemory = null;

    if (useProductMemory && user && validBusinessId) {
      try {
        const updated = await appendProductExchange(
          supabase,
          user.id,
          validBusinessId,
          lastMessage.content.trim(),
          reply,
          { skipPhaseUpdate: Boolean(roadmapContext) }
        );
        savedMemory = {
          context: toMemoryContext(updated),
          messages: updated.messages.map((m) => ({
            role: m.role,
            content: m.content,
            at: m.created_at,
          })),
        };
      } catch (saveErr) {
        const saveMessage = saveErr instanceof Error ? saveErr.message : '';
        if (!isMissingTableError(saveMessage)) {
          console.error('[coach] save memory failed', saveMessage);
        }
      }
    }

    return NextResponse.json({
      reply,
      memory: savedMemory,
      roadmapContext: roadmapContext ?? null,
      meta: {
        coachingPhase,
        recommendedTool: recommendedTool
          ? {
              name: recommendedTool.primary,
              url: recommendedTool.url,
              cost: recommendedTool.cost,
            }
          : null,
        contextualTools: contextualTools.map((tool) => ({
          name: tool.name,
          url: tool.url,
          cost: tool.cost,
        })),
        roadmapTaskSync: roadmapContext
          ? {
              day: roadmapContext.day,
              validatedInReply: parseCoachValidatedActionIndices(reply),
              totalTasks: roadmapContext.tasks.length,
            }
          : null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    const isConfig = message.includes('manquant') || message.includes('OPENAI_API_KEY');

    return NextResponse.json(
      {
        error: isConfig
          ? 'OpenAI non configuré. Ajoute OPENAI_API_KEY dans .env.local'
          : message,
      },
      { status: isConfig ? 503 : 500 }
    );
  }
}
