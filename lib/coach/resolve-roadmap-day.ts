import {
  getRoadmapDayTaskIndices,
  type RoadmapProgress,
} from '@/lib/account/roadmap-storage';
import { getUnlockedRoadmapMonths, loadSubscriptionMeta } from '@/lib/account/subscription-storage';
import type { RoadmapCoachContext } from '@/lib/coach/roadmap-coach-context';
import type { BusinessId } from '@/lib/quiz/data';
import type { MarketSegment } from '@/lib/quiz/market-segment';
import { buildPremiumRoadmap, type PremiumRoadmapPlan, type RoadmapDay } from '@/lib/quiz/premium-roadmap';
import { withoutFocusBlockTasks } from '@/lib/quiz/roadmap-task-filters';
import { MAX_ROADMAP_MONTHS, TOTAL_ROADMAP_DAYS } from '@/lib/quiz/roadmap-program';

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
    tasks: withoutFocusBlockTasks(day.tasks),
    tip: day.tip,
    businessId,
    businessName,
    phaseId: day.phaseId,
    phaseName: day.phaseName,
  };
}

export function buildCoachRoadmapPlan(
  businessId: BusinessId,
  options?: {
    unlockedMonths?: number;
    marketSegment?: MarketSegment | null;
  }
): PremiumRoadmapPlan {
  const unlockedMonths = options?.unlockedMonths ?? MAX_ROADMAP_MONTHS;
  return buildPremiumRoadmap(businessId, unlockedMonths, {
    marketSegment: options?.marketSegment ?? null,
  });
}

function relevantProgress(
  progress: RoadmapProgress | null | undefined,
  businessId: BusinessId
): RoadmapProgress | null {
  return progress?.businessId === businessId ? progress : null;
}

export function countRoadmapDayTasks(day: RoadmapDay): number {
  return withoutFocusBlockTasks(day.tasks).length;
}

/** Premier jour débloqué avec au moins une action non validée. */
export function findWorkingRoadmapDay(
  plan: PremiumRoadmapPlan,
  progress: RoadmapProgress | null | undefined,
  businessId: BusinessId
): RoadmapDay | undefined {
  const scoped = relevantProgress(progress, businessId);
  const unlocked = plan.activeDays
    .filter((day) => !day.locked)
    .sort((a, b) => a.day - b.day);

  for (const day of unlocked) {
    const totalTasks = countRoadmapDayTasks(day);
    if (totalTasks <= 0) continue;

    const done = getRoadmapDayTaskIndices(scoped, day.day, totalTasks).length;
    if (done < totalTasks) return day;
  }

  return unlocked[unlocked.length - 1];
}

export function isRoadmapDayComplete(
  progress: RoadmapProgress | null | undefined,
  businessId: BusinessId,
  globalDay: number,
  totalTasks: number
): boolean {
  if (totalTasks <= 0) return false;
  const scoped = relevantProgress(progress, businessId);
  return getRoadmapDayTaskIndices(scoped, globalDay, totalTasks).length >= totalTasks;
}

export interface ResolveLiveCoachRoadmapOptions {
  businessName?: string;
  progress?: RoadmapProgress | null;
  isSubscribed?: boolean;
  /** Jour choisi explicitement dans Mon plan (prioritaire s'il reste des actions). */
  preferGlobalDay?: number;
}

/**
 * Recalcule le contexte coach depuis la progression Mon plan (jour + tâches à jour).
 */
export function resolveLiveCoachRoadmapContext(
  businessId: BusinessId,
  options: ResolveLiveCoachRoadmapOptions = {}
): RoadmapCoachContext | null {
  const progress = options.progress ?? null;
  const marketSegment = relevantProgress(progress, businessId)?.marketSegment ?? null;
  const unlockedMonths =
    options.isSubscribed === false
      ? 1
      : getUnlockedRoadmapMonths(loadSubscriptionMeta());

  const plan = buildCoachRoadmapPlan(businessId, { unlockedMonths, marketSegment });

  let day: RoadmapDay | undefined;

  if (options.preferGlobalDay != null) {
    day = plan.activeDays.find((d) => d.day === options.preferGlobalDay);
    if (day && !day.locked) {
      const total = countRoadmapDayTasks(day);
      const complete = isRoadmapDayComplete(progress, businessId, day.day, total);
      if (complete) day = undefined;
    } else {
      day = undefined;
    }
  }

  if (!day) {
    day = findWorkingRoadmapDay(plan, progress, businessId);
  }

  if (!day) return null;

  return roadmapDayToCoachContext(
    day,
    businessId,
    options.businessName ?? plan.businessName
  );
}

/**
 * Contexte coach = progression live, sauf jour épinglé depuis Mon plan (encore en cours).
 */
export function resolveCoachRoadmapContext(
  businessId: BusinessId,
  pinnedContext: RoadmapCoachContext | null | undefined,
  options: Omit<ResolveLiveCoachRoadmapOptions, 'preferGlobalDay'> = {}
): RoadmapCoachContext | null {
  const live = resolveLiveCoachRoadmapContext(businessId, options);
  if (!pinnedContext || pinnedContext.businessId !== businessId) return live;

  const pinned = resolveLiveCoachRoadmapContext(businessId, {
    ...options,
    preferGlobalDay: pinnedContext.day,
  });

  if (!live || !pinned) return pinned ?? live;

  const pinnedTotal = pinned.tasks.length;
  const pinnedComplete = isRoadmapDayComplete(
    options.progress ?? null,
    businessId,
    pinned.day,
    pinnedTotal
  );

  if (!pinnedComplete && pinned.day !== live.day) {
    return pinned;
  }

  return live;
}

/** Contenu d'un jour pour le coach (tâches alignées Mon plan, segment B2B/B2C). */
export function getRoadmapDayForCoach(
  businessId: BusinessId,
  globalDay: number,
  marketSegment?: MarketSegment | null
): RoadmapCoachContext | null {
  if (globalDay < 1 || globalDay > TOTAL_ROADMAP_DAYS) return null;

  const plan = buildCoachRoadmapPlan(businessId, { marketSegment });
  const day = plan.activeDays.find((d) => d.day === globalDay);
  if (!day) return null;

  return roadmapDayToCoachContext(day, businessId, plan.businessName);
}

/**
 * Détecte une référence au parcours dans le message (jour global 1–180).
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
  explicitContext: RoadmapCoachContext | null | undefined,
  marketSegment?: MarketSegment | null
): RoadmapCoachContext | null {
  if (!businessId) return explicitContext ?? null;

  const detectedDay = detectRoadmapDayInMessage(message);
  if (detectedDay != null) {
    const resolved = getRoadmapDayForCoach(businessId, detectedDay, marketSegment);
    if (resolved) return resolved;
  }

  return explicitContext ?? null;
}
