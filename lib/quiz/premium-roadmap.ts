import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import { buildMonthRoadmapDays } from '@/lib/quiz/premium-roadmap-months';
import {
  DISPLAY_MONTH_LABELS,
  getGlobalDayOffset,
  getRoadmapMonthDayCount,
  getTotalUnlockedRoadmapDays,
  MAX_ROADMAP_MONTHS,
  ROADMAP_DAYS_PER_CHAPTER,
  weekForRoadmapMonthDay,
} from '@/lib/quiz/roadmap-program';
import { buildMonth1RoadmapDay, MONTH1_DAY_BLUEPRINTS } from '@/lib/quiz/roadmap-month1';

export interface RoadmapDay {
  day: number;
  month: number;
  dayInMonth: number;
  week: number;
  weekLabel: string;
  /** Alignement parcours coach 8 étapes */
  phaseId?: number;
  phaseName?: string;
  title: string;
  objective: string;
  tasks: string[];
  tip?: string;
  locked?: boolean;
}

export interface RoadmapMonthBlock {
  month: number;
  label: string;
  unlocked: boolean;
  weeks: { week: number; label: string; days: RoadmapDay[] }[];
}

export interface PremiumRoadmapPlan {
  businessId: BusinessId;
  businessName: string;
  businessIcon: string;
  unlockedMonths: number;
  totalUnlockedDays: number;
  maxMonths: number;
  months: RoadmapMonthBlock[];
  /** Tous les jours débloqués (aplatis) */
  activeDays: RoadmapDay[];
}

/** @deprecated Utiliser buildPremiumRoadmap */
export interface Roadmap30Plan {
  businessId: BusinessId;
  businessName: string;
  businessIcon: string;
  totalDays: number;
  weeks: { week: number; label: string; days: RoadmapDay[] }[];
}

function groupDaysByWeeks(days: RoadmapDay[]): RoadmapMonthBlock['weeks'] {
  const weekMap = new Map<number, RoadmapDay[]>();
  for (const day of days) {
    const list = weekMap.get(day.week) ?? [];
    list.push(day);
    weekMap.set(day.week, list);
  }
  return [...weekMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([week, weekDays]) => ({
      week,
      label: weekDays[0]?.weekLabel ?? `Semaine ${week}`,
      days: weekDays,
    }));
}

/** Chapitre N = mois N du parcours semestriel (30 jours natifs). */
function buildDisplayMonthDays(displayMonth: number, businessId: BusinessId): RoadmapDay[] {
  const daysInMonth = getRoadmapMonthDayCount(displayMonth);
  const globalOffset = getGlobalDayOffset(displayMonth);

  const sourceDays =
    displayMonth === 1
      ? MONTH1_DAY_BLUEPRINTS.map((blueprint) => buildMonth1RoadmapDay(businessId, blueprint))
      : buildMonthRoadmapDays(displayMonth, businessId);

  return sourceDays.map((sourceDay, index) => {
    const dayInMonth = index + 1;
    const week = weekForRoadmapMonthDay(dayInMonth, daysInMonth);
    return {
      ...sourceDay,
      day: globalOffset + dayInMonth,
      month: displayMonth,
      dayInMonth,
      week,
      weekLabel: sourceDay.weekLabel,
    };
  });
}

export function buildPremiumRoadmap(
  businessId: BusinessId,
  unlockedMonths: number
): PremiumRoadmapPlan {
  const profile = businessProfiles[businessId];
  const monthsToShow = Math.min(MAX_ROADMAP_MONTHS, Math.max(1, unlockedMonths));
  const months: RoadmapMonthBlock[] = [];

  for (let month = 1; month <= MAX_ROADMAP_MONTHS; month++) {
    const unlocked = month <= monthsToShow;
    const days = buildDisplayMonthDays(month, businessId).map((d) => ({
      ...d,
      locked: !unlocked,
    }));

    months.push({
      month,
      label: DISPLAY_MONTH_LABELS[month] ?? `Mois ${month}`,
      unlocked,
      weeks: groupDaysByWeeks(days),
    });
  }

  const activeDays = months
    .filter((m) => m.unlocked)
    .flatMap((m) => m.weeks.flatMap((w) => w.days));

  return {
    businessId,
    businessName: profile.name,
    businessIcon: profile.icon,
    unlockedMonths: monthsToShow,
    totalUnlockedDays: getTotalUnlockedRoadmapDays(monthsToShow),
    maxMonths: MAX_ROADMAP_MONTHS,
    months,
    activeDays,
  };
}

export function build30DayRoadmap(businessId: BusinessId): Roadmap30Plan {
  const plan = buildPremiumRoadmap(businessId, 1);
  const month1 = plan.months[0];
  return {
    businessId: plan.businessId,
    businessName: plan.businessName,
    businessIcon: plan.businessIcon,
    totalDays: getRoadmapMonthDayCount(1),
    weeks: month1.weeks,
  };
}

export function getNextUnlockDate(activatedAt: string, targetMonth: number): Date | null {
  if (!activatedAt || targetMonth <= 1) return null;
  const start = new Date(activatedAt);
  if (Number.isNaN(start.getTime())) return null;
  const unlock = new Date(start);
  unlock.setDate(unlock.getDate() + (targetMonth - 1) * ROADMAP_DAYS_PER_CHAPTER);
  return unlock;
}

export { getTotalUnlockedRoadmapDays, TOTAL_ROADMAP_DAYS } from '@/lib/quiz/roadmap-program';
