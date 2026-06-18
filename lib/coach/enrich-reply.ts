import {
  buildParcoursPlanBlock,
  buildToolMethodSection,
  resolveCoachingPhase,
  resolvePresenceSubstep,
  shouldInjectToolSection,
} from '@/lib/coach/plan-builder';
import {
  formatContextualToolsBlock,
  resolveContextualTools,
} from '@/lib/coach/contextual-tools';
import {
  isCoachFreeQuestionMode,
  sanitizeCoachReplyForQuestionMode,
} from '@/lib/coach/question-mode';
import type { CoachInteractionMode } from '@/lib/coach/interaction-mode';
import type { RoadmapCoachContext } from '@/lib/coach/roadmap-coach-context';
import type { BusinessId } from '@/lib/quiz/data';

interface EnrichContext {
  businessId?: BusinessId | null;
  techLevel?: string;
  coachingPhase?: number;
  coachingStepLabel?: string;
  userMessage?: string;
  roadmapContext?: RoadmapCoachContext | null;
  interactionMode?: CoachInteractionMode;
}

function replaceOrInsertSection(
  content: string,
  emoji: string,
  title: string,
  body: string
): string {
  const header = `${emoji} ${title}`;
  const block = `${header}\n${body.trim()}`;

  const pattern = new RegExp(
    `[📌🎯📍📋🛠️✅➡️❓🧭]*\\s*${title}\\s*\\n+[\\s\\S]*?(?=\\n\\n[📌🎯📍📋🛠️✅➡️❓🧭]|$)`,
    'i'
  );

  if (pattern.test(content)) {
    return content.replace(pattern, block);
  }

  const parcoursIdx = content.search(/📍\s*PARCOURS/i);
  if (parcoursIdx >= 0) {
    const afterParcours = content.slice(parcoursIdx);
    const nextSection = afterParcours.search(/\n\n[📌🎯📍📋🛠️✅➡️❓🧭]/);
    const insertAt =
      nextSection >= 0 ? parcoursIdx + nextSection + 2 : content.length;
    return `${content.slice(0, insertAt)}\n\n${block}${content.slice(insertAt)}`;
  }

  return `${content.trim()}\n\n${block}`;
}

/**
 * Garantit plan numéroté + outils concrets adaptés au contenu de la réponse.
 */
export function enrichCoachReply(rawReply: string, ctx: EnrichContext): string {
  let reply = rawReply.trim();

  const contextualTools = resolveContextualTools({
    userMessage: ctx.userMessage,
    reply: rawReply,
    businessId: ctx.businessId,
    techLevel: ctx.techLevel,
    coachingPhase: ctx.coachingPhase,
  });

  const isProgression = !ctx.roadmapContext && ctx.interactionMode !== 'question';

  if (isProgression) {
    const phase = resolveCoachingPhase(
      rawReply,
      ctx.coachingPhase,
      ctx.userMessage
    );
    const substep = resolvePresenceSubstep(rawReply, ctx.coachingStepLabel);
    const businessId = ctx.businessId ?? undefined;

    const planBody = buildParcoursPlanBlock(phase, businessId, substep);
    reply = replaceOrInsertSection(reply, '📋', 'PLAN (ce qui reste)', planBody);

    if (
      businessId &&
      shouldInjectToolSection(phase, ctx.userMessage) &&
      contextualTools.length === 0
    ) {
      const toolBody = buildToolMethodSection(businessId, ctx.techLevel);
      reply = replaceOrInsertSection(reply, '🛠️', 'OUTIL & MÉTHODE', toolBody);
    }
  }

  if (contextualTools.length > 0) {
    const toolBody = formatContextualToolsBlock(contextualTools);
    reply = replaceOrInsertSection(reply, '🛠️', 'OUTILS RECOMMANDÉS', toolBody);
  }

  if (isCoachFreeQuestionMode(ctx.interactionMode ?? 'progression', Boolean(ctx.roadmapContext))) {
    reply = sanitizeCoachReplyForQuestionMode(reply);
  }

  return reply;
}
