import { getRoadmapDayTaskIndices, loadRoadmapProgress } from '@/lib/account/roadmap-storage';
import { getUnlockedRoadmapMonths, loadSubscriptionMeta } from '@/lib/account/subscription-storage';
import { countRoadmapDayTasks, findWorkingRoadmapDay } from '@/lib/coach/resolve-roadmap-day';
import type { BusinessId } from '@/lib/quiz/data';
import { buildPremiumRoadmap, type RoadmapDay } from '@/lib/quiz/premium-roadmap';

export type RoadmapStepStatus = 'start' | 'in_progress' | 'completed_all';

export interface CurrentRoadmapStep {
  day: RoadmapDay;
  status: RoadmapStepStatus;
  completedCount: number;
  unlockedDays: number;
}

export function resolveCurrentRoadmapStep(
  businessId: BusinessId,
  isSubscribed: boolean
): CurrentRoadmapStep {
  const unlockedMonths = isSubscribed
    ? getUnlockedRoadmapMonths(loadSubscriptionMeta())
    : 1;
  const progress = loadRoadmapProgress();
  const marketSegment =
    progress?.businessId === businessId ? progress.marketSegment ?? null : null;
  const plan = buildPremiumRoadmap(businessId, unlockedMonths, { marketSegment });

  const unlockedDays = plan.activeDays.filter((d) => !d.locked);
  const workingDay = findWorkingRoadmapDay(plan, progress, businessId);
  const allComplete =
    workingDay &&
    unlockedDays.length > 0 &&
    unlockedDays.every((d) => {
      const total = countRoadmapDayTasks(d);
      if (total <= 0) return true;
      return (
        getRoadmapDayTaskIndices(
          progress?.businessId === businessId ? progress : null,
          d.day,
          total
        ).length >= total
      );
    });

  if (workingDay && !allComplete) {
    const totalTasks = countRoadmapDayTasks(workingDay);
    const doneCount = getRoadmapDayTaskIndices(
      progress?.businessId === businessId ? progress : null,
      workingDay.day,
      totalTasks
    ).length;

    return {
      day: workingDay,
      status:
        doneCount <= 0 ? 'start' : doneCount >= totalTasks ? 'completed_all' : 'in_progress',
      completedCount: progress?.businessId === businessId ? progress.completedDays.length : 0,
      unlockedDays: plan.totalUnlockedDays,
    };
  }

  const lastDay = unlockedDays[unlockedDays.length - 1] ?? plan.activeDays[0];
  return {
    day: lastDay,
    status: 'completed_all',
    completedCount: progress?.businessId === businessId ? progress.completedDays.length : 0,
    unlockedDays: plan.totalUnlockedDays,
  };
}

export function formatRoadmapStepHeadline(step: CurrentRoadmapStep): string {
  const { day, status } = step;
  if (status === 'completed_all') {
    return `Jour ${day.dayInMonth}. Chapitre ${day.month}. Parcours à jour`;
  }
  if (status === 'start') {
    return `Jour ${day.dayInMonth}. Chapitre ${day.month}. Point de départ`;
  }
  return `Jour ${day.dayInMonth}. Chapitre ${day.month}. Étape en cours`;
}
