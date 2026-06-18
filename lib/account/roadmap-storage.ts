import type { BusinessId } from '@/lib/quiz/data';

export const ROADMAP_PROGRESS_KEY = 'buildrai_roadmap_progress';
export const ROADMAP_PROGRESS_EVENT = 'buildrai:roadmap-progress';

/** Indices des tâches cochées, par numéro de jour global (1–180). */
export type RoadmapCompletedTasks = Record<number, number[]>;

export interface RoadmapProgress {
  businessId: BusinessId;
  completedDays: number[];
  completedTasks?: RoadmapCompletedTasks;
  updatedAt: string;
}

export function normalizeRoadmapProgress(progress: RoadmapProgress): RoadmapProgress {
  return {
    ...progress,
    completedTasks: progress.completedTasks ?? {},
  };
}

export function loadRoadmapProgress(): RoadmapProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ROADMAP_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RoadmapProgress;
    if (!parsed.businessId || !Array.isArray(parsed.completedDays)) return null;
    return normalizeRoadmapProgress(parsed);
  } catch {
    return null;
  }
}

export function saveRoadmapProgress(
  progress: RoadmapProgress,
  options?: { skipServerSync?: boolean }
): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizeRoadmapProgress(progress);
  localStorage.setItem(ROADMAP_PROGRESS_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(ROADMAP_PROGRESS_EVENT));

  if (!options?.skipServerSync) {
    void import('@/lib/account/roadmap-sync').then(({ syncRoadmapProgressToServer }) => {
      void syncRoadmapProgressToServer(normalized);
    });
  }
}

function sortTaskIndices(indices: number[]): number[] {
  return [...new Set(indices.filter((index) => Number.isFinite(index) && index >= 0))].sort(
    (a, b) => a - b
  );
}

/** Tâches déjà cochées pour un jour (rétrocompat : jour terminé = toutes cochées). */
export function getRoadmapDayTaskIndices(
  progress: RoadmapProgress | null | undefined,
  day: number,
  totalTasks: number
): number[] {
  if (totalTasks <= 0) return [];

  const stored = progress?.completedTasks?.[day];
  if (stored?.length) {
    return sortTaskIndices(stored.filter((index) => index < totalTasks));
  }

  if (progress?.completedDays.includes(day)) {
    return Array.from({ length: totalTasks }, (_, index) => index);
  }

  return [];
}

export function isRoadmapTaskDone(
  progress: RoadmapProgress | null | undefined,
  day: number,
  taskIndex: number,
  totalTasks: number
): boolean {
  return getRoadmapDayTaskIndices(progress, day, totalTasks).includes(taskIndex);
}

export function getRoadmapDayTasksDoneCount(
  progress: RoadmapProgress | null | undefined,
  day: number,
  totalTasks: number
): number {
  return getRoadmapDayTaskIndices(progress, day, totalTasks).length;
}

function applyDayTaskIndices(
  base: RoadmapProgress,
  day: number,
  taskIndices: number[],
  totalTasks: number
): RoadmapProgress {
  const completedTasks: RoadmapCompletedTasks = { ...(base.completedTasks ?? {}) };
  const normalized = sortTaskIndices(taskIndices).filter((index) => index < totalTasks);

  if (normalized.length > 0) {
    completedTasks[day] = normalized;
  } else {
    delete completedTasks[day];
  }

  const daySet = new Set(base.completedDays);
  if (totalTasks > 0 && normalized.length >= totalTasks) {
    daySet.add(day);
  } else {
    daySet.delete(day);
  }

  return {
    ...base,
    completedTasks,
    completedDays: [...daySet].sort((a, b) => a - b),
    updatedAt: new Date().toISOString(),
  };
}

export function toggleRoadmapTask(
  businessId: BusinessId,
  day: number,
  taskIndex: number,
  totalTasks: number,
  completed: boolean
): RoadmapProgress {
  const existing = loadRoadmapProgress();
  const base: RoadmapProgress = normalizeRoadmapProgress(
    existing?.businessId === businessId
      ? existing
      : { businessId, completedDays: [], completedTasks: {}, updatedAt: new Date().toISOString() }
  );

  const current = new Set(getRoadmapDayTaskIndices(base, day, totalTasks));
  if (completed) current.add(taskIndex);
  else current.delete(taskIndex);

  const next = applyDayTaskIndices(base, day, [...current], totalTasks);
  saveRoadmapProgress(next);
  return next;
}

export function toggleRoadmapDay(
  businessId: BusinessId,
  day: number,
  completed: boolean,
  totalTasks = 0
): RoadmapProgress {
  const existing = loadRoadmapProgress();
  const base: RoadmapProgress = normalizeRoadmapProgress(
    existing?.businessId === businessId
      ? existing
      : { businessId, completedDays: [], completedTasks: {}, updatedAt: new Date().toISOString() }
  );

  if (completed && totalTasks > 0) {
    const allIndices = Array.from({ length: totalTasks }, (_, index) => index);
    const next = applyDayTaskIndices(base, day, allIndices, totalTasks);
    saveRoadmapProgress(next);
    return next;
  }

  const completedTasks: RoadmapCompletedTasks = { ...(base.completedTasks ?? {}) };
  delete completedTasks[day];

  const daySet = new Set(base.completedDays);
  daySet.delete(day);

  const next: RoadmapProgress = {
    ...base,
    completedTasks,
    completedDays: [...daySet].sort((a, b) => a - b),
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

export function mergeRoadmapCompletedTasks(
  local: RoadmapCompletedTasks | undefined,
  remote: RoadmapCompletedTasks | undefined
): RoadmapCompletedTasks {
  const merged: RoadmapCompletedTasks = { ...(local ?? {}) };

  for (const [dayKey, remoteIndices] of Object.entries(remote ?? {})) {
    const day = Number(dayKey);
    if (!Number.isFinite(day)) continue;
    const union = new Set([...(merged[day] ?? []), ...remoteIndices]);
    merged[day] = sortTaskIndices([...union]);
  }

  return merged;
}

export function deriveCompletedDaysFromTasks(
  completedTasks: RoadmapCompletedTasks,
  taskCountsByDay: Record<number, number>
): number[] {
  const days = new Set<number>();

  for (const [dayKey, indices] of Object.entries(completedTasks)) {
    const day = Number(dayKey);
    const total = taskCountsByDay[day] ?? 0;
    if (total > 0 && indices.length >= total) {
      days.add(day);
    }
  }

  return [...days].sort((a, b) => a - b);
}
