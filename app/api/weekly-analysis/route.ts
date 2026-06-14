import { resolveUserSubscription } from '@/lib/account/subscription-resolution';
import { PLAN_COOKIE, SUBSCRIPTION_COOKIE } from '@/lib/admin';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';
import { getCoachModel, getOpenAI } from '@/lib/openai';
import {
  computeWeeklyBaselineScores,
  mergeWeeklyScores,
} from '@/lib/weekly-analysis/compute-scores';
import {
  buildWeeklyAnalysisUserPrompt,
  WEEKLY_ANALYSIS_SYSTEM,
  type WeeklyAnalysisInput,
} from '@/lib/weekly-analysis/prompt';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

function clampScore(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const resolved = await resolveUserSubscription(
      supabase,
      user.id,
      user.email,
      cookieStore.get(SUBSCRIPTION_COOKIE)?.value,
      cookieStore.get(PLAN_COOKIE)?.value
    );

    if (!resolved.active || resolved.planId !== 'growth') {
      return NextResponse.json(
        {
          error:
            'Analyse hebdomadaire réservée au plan Premium. Business Accelerator (79 €/mois).',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const profile = body.profile as QuizProfileSnapshot | null | undefined;
    const businessId = body.businessId as string | undefined;

    if (!profile?.topBusinessId) {
      return NextResponse.json({ error: 'Profil quiz requis.' }, { status: 400 });
    }

    const validBusinessId =
      businessId && VALID_BUSINESS_IDS.has(businessId)
        ? (businessId as BusinessId)
        : profile.topBusinessId;

    const input: WeeklyAnalysisInput = {
      profile,
      businessId: validBusinessId,
      businessName: businessProfiles[validBusinessId].name,
      analytics: body.analytics ?? {
        coachMessages: 0,
        coachSessions: 0,
        lastActiveAt: null,
        quizCompletedAt: null,
      },
      activity7d: Array.isArray(body.activity7d) ? body.activity7d : [],
      roadmap: body.roadmap ?? null,
      coach: body.coach ?? null,
    };

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: getCoachModel(),
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: WEEKLY_ANALYSIS_SYSTEM },
        { role: 'user', content: buildWeeklyAnalysisUserPrompt(input) },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: 'Réponse IA vide.' }, { status: 502 });
    }

    const parsed = JSON.parse(raw) as {
      summary?: string;
      sections?: { title?: string; content?: string }[];
      priorities?: string[];
      risks?: string[];
      scores?: {
        momentum?: number;
        consistency?: number;
        roadmapAlignment?: number;
      };
    };

    const sections = (parsed.sections ?? [])
      .filter((section) => section.title && section.content)
      .map((section) => ({
        title: String(section.title),
        content: String(section.content),
      }));

    if (!parsed.summary || sections.length === 0) {
      return NextResponse.json({ error: 'Format d\'analyse invalide.' }, { status: 502 });
    }

    const aiScores = {
      momentum: clampScore(parsed.scores?.momentum),
      consistency: clampScore(parsed.scores?.consistency),
      roadmapAlignment: clampScore(parsed.scores?.roadmapAlignment),
    };

    const baselineScores = computeWeeklyBaselineScores({
      activity7d: input.activity7d,
      coachMessagesTotal: input.analytics.coachMessages,
      lastActiveAt: input.analytics.lastActiveAt,
      roadmap: input.roadmap,
      coach: input.coach,
    });

    const scores = mergeWeeklyScores(aiScores, baselineScores);

    return NextResponse.json({
      summary: String(parsed.summary),
      sections,
      priorities: (parsed.priorities ?? []).map(String).slice(0, 5),
      risks: (parsed.risks ?? []).map(String).slice(0, 5),
      scores,
      syncSnapshot: input.roadmap
        ? {
            roadmapDay: input.roadmap.currentGlobalDay,
            roadmapDayTitle: input.roadmap.currentDayTitle,
            chapter: input.roadmap.currentChapter,
            chapterLabel: input.roadmap.currentChapterLabel,
            completedDays: input.roadmap.completedCount,
            unlockedDays: input.roadmap.totalUnlockedDays,
            percentUnlocked: input.roadmap.percentUnlocked,
            coachingPhase: input.coach?.coachingPhase ?? null,
            coachingStepLabel: input.coach?.coachingStepLabel ?? null,
            expectedCoachPhase: input.roadmap.expectedCoachPhase,
            coachMemorySource: input.coach?.source ?? 'none',
          }
        : null,
    });
  } catch (err) {
    console.error('weekly-analysis', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
