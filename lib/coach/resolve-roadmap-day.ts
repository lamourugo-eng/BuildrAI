import type { RoadmapCoachContext } from '@/lib/coach/roadmap-coach-context';
import { buildPremiumRoadmap, type RoadmapDay } from '@/lib/quiz/premium-roadmap';
import { MAX_ROADMAP_MONTHS, TOTAL_ROADMAP_DAYS } from '@/lib/quiz/roadmap-program';
import type { BusinessId } from '@/lib/quiz/data';

export function roadmapDayToCoachContext(
  day: RoadmapDay,
  businessId: BusinessId,
  businessName?: string
): RoadmapCoachContext {
  return {
    day: day.day,
    dayInMonth: day.dayInMonth,
    month: day.month,
    title: day.title,
    objective: day.objective,
    tasks: day.tasks,
    tip: day.tip,
    businessId,
    businessName,
    phaseId: day.phaseId,
    phaseName: day.phaseName,
  };
}

/** Contenu des ${TOTAL_ROADMAP_DAYS} jours (tous chapitres) pour le coach, indépendamment du déblocage UI. */
export function getRoadmapDayForCoach(
  businessId: BusinessId,
  globalDay: number
): RoadmapCoachContext | null {
  if (globalDay < 1 || globalDay > TOTAL_ROADMAP_DAYS) return null;

  const plan = buildPremiumRoadmap(businessId, MAX_ROADMAP_MONTHS);
  const day = plan.months
    .flatMap((m) => m.weeks.flatMap((w) => w.days))
    .find((d) => d.day === globalDay);

  if (!day) return null;
  return roadmapDayToCoachContext(day, businessId, plan.businessName);
}

/**
 * Détecte une référence au parcours dans le message (jour global 1–${TOTAL_ROADMAP_DAYS}).
 * Ex. « jour 42 », « j42 », « day 15 », « 15/180 ».
 */
export function detectRoadmapDayInMessage(message: string): number | null {
  const text = message.trim();
  if (!text) return null;

  const patterns = [
    /\bjour\s*(?:global\s*)?(\d{1,3})\b/i,
    /\bj\s*(\d{1,3})\b/i,
    /\bday\s*(\d{1,3})\b/i,
    new RegExp(`\\b(\\d{1,3})\\s*\\/\\s*${TOTAL_ROADMAP_DAYS}\\b`),
    new RegExp(`\\b(\\d{1,3})\\s*\\/\\s*150\\b`),
    /(?:parcours|programme)[^\d]{0,20}(\d{1,3})\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const day = Number.parseInt(match[1], 10);
    if (day >= 1 && day <= TOTAL_ROADMAP_DAYS) return day;
  }

  return null;
}

export function resolveRoadmapCoachContextForMessage(
  message: string,
  businessId: BusinessId | null | undefined,
  explicitContext: RoadmapCoachContext | null | undefined
): RoadmapCoachContext | null {
  if (!businessId) return explicitContext ?? null;

  const detectedDay = detectRoadmapDayInMessage(message);
  if (detectedDay != null) {
    const resolved = getRoadmapDayForCoach(businessId, detectedDay);
    if (resolved) return resolved;
  }

  return explicitContext ?? null;
}
