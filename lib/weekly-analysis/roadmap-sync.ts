import { getRoadmapCompletionPercent, loadRoadmapProgress } from '@/lib/account/roadmap-storage';
import {
  getUnlockedRoadmapMonths,
  loadSubscriptionMeta,
} from '@/lib/account/subscription-storage';
import {
  formatRoadmapStepHeadline,
  resolveCurrentRoadmapStep,
  type RoadmapStepStatus,
} from '@/lib/quiz/current-roadmap-step';
import type { BusinessId } from '@/lib/quiz/data';
import { buildPremiumRoadmap } from '@/lib/quiz/premium-roadmap';
import {
  getSemesterChapterMeta,
  getTotalUnlockedRoadmapDays,
  ROADMAP_DAYS_PER_CHAPTER,
  TOTAL_ROADMAP_DAYS,
  weekForRoadmapMonthDay,
} from '@/lib/quiz/roadmap-program';

export interface WeeklyRoadmapSnapshot {
  completedDays: number[];
  totalUnlockedDays: number;
  totalProgramDays: number;
  unlockedMonths: number;
  percentUnlocked: number;
  percentProgram: number;
  status: RoadmapStepStatus;
  currentGlobalDay: number;
  currentDayInMonth: number;
  currentChapter: number;
  currentDayTitle: string;
  currentDayObjective: string;
  currentChapterLabel: string;
  currentChapterArc: string;
  headline: string;
  nextGlobalDay: number | null;
  nextDayTitle: string | null;
  expectedCoachPhase: number;
  completedCount: number;
  lastUpdatedAt: string | null;
}

export function getExpectedCoachPhaseForChapterDay(
  chapter: number,
  dayInMonth: number
): number {
  const meta = getSemesterChapterMeta(chapter);
  if (!meta) return 1;
  const week = weekForRoadmapMonthDay(dayInMonth, ROADMAP_DAYS_PER_CHAPTER);
  return meta.phaseIds[Math.min(3, Math.max(0, week - 1))] ?? meta.phaseIds[0];
}

export function buildWeeklyRoadmapSnapshot(
  businessId: BusinessId,
  isSubscribed: boolean
): WeeklyRoadmapSnapshot | null {
  if (!isSubscribed) return null;

  const meta = loadSubscriptionMeta();
  const unlockedMonths = getUnlockedRoadmapMonths(meta);
  const totalUnlockedDays = getTotalUnlockedRoadmapDays(unlockedMonths);
  const progress = loadRoadmapProgress();
  const completedDays =
    progress?.businessId === businessId ? [...progress.completedDays].sort((a, b) => a - b) : [];

  const step = resolveCurrentRoadmapStep(businessId, true);
  const chapterMeta = getSemesterChapterMeta(step.day.month);
  const expectedCoachPhase = getExpectedCoachPhaseForChapterDay(
    step.day.month,
    step.day.dayInMonth
  );

  const plan = buildPremiumRoadmap(businessId, unlockedMonths);
  const nextDay =
    step.status === 'completed_all'
      ? null
      : plan.activeDays
          .filter((d) => !d.locked && !completedDays.includes(d.day))
          .sort((a, b) => a.day - b.day)[0] ?? null;

  return {
    completedDays,
    totalUnlockedDays,
    totalProgramDays: TOTAL_ROADMAP_DAYS,
    unlockedMonths,
    percentUnlocked: getRoadmapCompletionPercent(completedDays, totalUnlockedDays),
    percentProgram: getRoadmapCompletionPercent(completedDays, TOTAL_ROADMAP_DAYS),
    status: step.status,
    currentGlobalDay: step.day.day,
    currentDayInMonth: step.day.dayInMonth,
    currentChapter: step.day.month,
    currentDayTitle: step.day.title,
    currentDayObjective: step.day.objective,
    currentChapterLabel: chapterMeta?.label ?? `Chapitre ${step.day.month}`,
    currentChapterArc: chapterMeta?.arc ?? '',
    headline: formatRoadmapStepHeadline(step),
    nextGlobalDay: nextDay?.day ?? null,
    nextDayTitle: nextDay?.title ?? null,
    expectedCoachPhase,
    completedCount: completedDays.length,
    lastUpdatedAt: progress?.businessId === businessId ? progress.updatedAt : null,
  };
}
