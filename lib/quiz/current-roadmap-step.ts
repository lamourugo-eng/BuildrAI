import { loadRoadmapProgress } from '@/lib/account/roadmap-storage';
import { getUnlockedRoadmapMonths, loadSubscriptionMeta } from '@/lib/account/subscription-storage';
import type { BusinessId } from '@/lib/quiz/data';
import {
  buildPremiumRoadmap,
  type RoadmapDay,
} from '@/lib/quiz/premium-roadmap';

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
  const plan = buildPremiumRoadmap(businessId, unlockedMonths);
  const progress = loadRoadmapProgress();
  const completed = new Set(
    progress?.businessId === businessId ? progress.completedDays : []
  );

  const unlockedDays = plan.activeDays.filter((d) => !d.locked);
  const nextDay = unlockedDays.find((d) => !completed.has(d.day));

  if (nextDay) {
    return {
      day: nextDay,
      status: completed.size > 0 ? 'in_progress' : 'start',
      completedCount: completed.size,
      unlockedDays: plan.totalUnlockedDays,
    };
  }

  const lastDay = unlockedDays[unlockedDays.length - 1] ?? plan.activeDays[0];
  return {
    day: lastDay,
    status: 'completed_all',
    completedCount: completed.size,
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
