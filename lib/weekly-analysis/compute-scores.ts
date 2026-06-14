import type { WeeklyAnalysisScores } from '@/lib/account/weekly-analysis-storage';
import type { WeeklyCoachSnapshot } from '@/lib/weekly-analysis/coach-sync';
import type { WeeklyRoadmapSnapshot } from '@/lib/weekly-analysis/roadmap-sync';

export interface WeeklyScoreInput {
  activity7d: { label: string; count: number }[];
  coachMessagesTotal: number;
  lastActiveAt: string | null;
  roadmap: WeeklyRoadmapSnapshot | null;
  coach: WeeklyCoachSnapshot | null;
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return null;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function computeWeeklyBaselineScores(input: WeeklyScoreInput): WeeklyAnalysisScores {
  const activeDays = input.activity7d.filter((d) => d.count > 0).length;
  const weekMessages = input.activity7d.reduce((sum, d) => sum + d.count, 0);

  let consistency = Math.round((activeDays / 7) * 100);
  if (input.coachMessagesTotal >= 3 && activeDays === 0) {
    consistency = Math.max(0, consistency - 15);
  }

  let momentum = Math.min(100, Math.round(weekMessages * 12 + activeDays * 6));
  const inactiveDays = daysSince(input.lastActiveAt);
  if (inactiveDays != null) {
    if (inactiveDays <= 1) momentum = Math.min(100, momentum + 10);
    else if (inactiveDays >= 5) momentum = Math.max(0, momentum - 20);
  }

  let roadmapAlignment = 0;
  if (input.roadmap) {
    const completionPart = input.roadmap.percentUnlocked * 0.45;
    let phasePart = 25;

    if (input.coach) {
      const delta = Math.abs(
        input.coach.coachingPhase - input.roadmap.expectedCoachPhase
      );
      phasePart = Math.max(0, 55 - delta * 12);
    } else if (input.roadmap.completedCount === 0) {
      phasePart = 10;
    }

    const statusBonus =
      input.roadmap.status === 'completed_all'
        ? 15
        : input.roadmap.status === 'in_progress'
          ? 8
          : 0;

    roadmapAlignment = Math.min(
      100,
      Math.round(completionPart + phasePart + statusBonus)
    );
  }

  return {
    momentum: Math.max(0, Math.min(100, momentum)),
    consistency: Math.max(0, Math.min(100, consistency)),
    roadmapAlignment: Math.max(0, Math.min(100, roadmapAlignment)),
  };
}

/** Fusionne scores IA et baseline (baseline = plancher de cohérence données). */
export function mergeWeeklyScores(
  ai: WeeklyAnalysisScores,
  baseline: WeeklyAnalysisScores
): WeeklyAnalysisScores {
  const blend = (a: number, b: number) =>
    Math.max(0, Math.min(100, Math.round(a * 0.45 + b * 0.55)));

  return {
    momentum: blend(ai.momentum, baseline.momentum),
    consistency: blend(ai.consistency, baseline.consistency),
    roadmapAlignment: blend(ai.roadmapAlignment, baseline.roadmapAlignment),
  };
}
