import type { BusinessId } from '@/lib/quiz/data';

export const ROADMAP_PROGRESS_KEY = 'buildrai_roadmap_progress';
export const ROADMAP_PROGRESS_EVENT = 'buildrai:roadmap-progress';

export interface RoadmapProgress {
  businessId: BusinessId;
  completedDays: number[];
  updatedAt: string;
}

export function loadRoadmapProgress(): RoadmapProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ROADMAP_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RoadmapProgress;
    if (!parsed.businessId || !Array.isArray(parsed.completedDays)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveRoadmapProgress(
  progress: RoadmapProgress,
  options?: { skipServerSync?: boolean }
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROADMAP_PROGRESS_KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event(ROADMAP_PROGRESS_EVENT));

  if (!options?.skipServerSync) {
    void import('@/lib/account/roadmap-sync').then(({ syncRoadmapProgressToServer }) => {
      void syncRoadmapProgressToServer(progress);
    });
  }
}

export function toggleRoadmapDay(
  businessId: BusinessId,
  day: number,
  completed: boolean
): RoadmapProgress {
  const existing = loadRoadmapProgress();
  const base: RoadmapProgress =
    existing?.businessId === businessId
      ? existing
      : { businessId, completedDays: [], updatedAt: new Date().toISOString() };

  const set = new Set(base.completedDays);
  if (completed) set.add(day);
  else set.delete(day);

  const next: RoadmapProgress = {
    businessId,
    completedDays: [...set].sort((a, b) => a - b),
    updatedAt: new Date().toISOString(),
  };
  saveRoadmapProgress(next);
  return next;
}

export function getRoadmapCompletionPercent(
  completedDays: number[],
  totalDays = 30
): number {
  if (totalDays <= 0) return 0;
  return Math.round((completedDays.length / totalDays) * 100);
}
