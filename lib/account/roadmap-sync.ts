import type { RoadmapProgress } from '@/lib/account/roadmap-storage';
import {
  loadRoadmapProgress,
  saveRoadmapProgress,
} from '@/lib/account/roadmap-storage';
import { isValidBusinessId } from '@/lib/quiz/business-choices';

function isValidRoadmapProgress(raw: unknown): raw is RoadmapProgress {
  if (!raw || typeof raw !== 'object') return false;
  const progress = raw as Partial<RoadmapProgress>;
  return (
    typeof progress.businessId === 'string' &&
    isValidBusinessId(progress.businessId) &&
    Array.isArray(progress.completedDays)
  );
}

function mergeRoadmapProgress(local: RoadmapProgress | null, remote: RoadmapProgress | null): RoadmapProgress | null {
  if (!local && !remote) return null;
  if (!local) return remote;
  if (!remote) return local;
  if (local.businessId !== remote.businessId) {
    const localUpdated = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
    const remoteUpdated = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
    return localUpdated >= remoteUpdated ? local : remote;
  }

  const mergedDays = [...new Set([...local.completedDays, ...remote.completedDays])].sort(
    (a, b) => a - b
  );
  const localUpdated = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
  const remoteUpdated = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;

  return {
    businessId: local.businessId,
    completedDays: mergedDays,
    updatedAt: new Date(Math.max(localUpdated, remoteUpdated)).toISOString(),
  };
}

export async function syncRoadmapProgressToServer(
  progress?: RoadmapProgress | null
): Promise<boolean> {
  const payload = progress ?? loadRoadmapProgress();
  if (!payload) return false;

  try {
    const res = await fetch('/api/user/roadmap-progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: payload }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function hydrateRoadmapProgressFromServer(): Promise<RoadmapProgress | null> {
  const local = loadRoadmapProgress();

  try {
    const res = await fetch('/api/user/roadmap-progress', { method: 'GET', cache: 'no-store' });

    if (res.status === 401) {
      return local;
    }

    if (!res.ok) {
      if (local) void syncRoadmapProgressToServer(local);
      return local;
    }

    const data = (await res.json()) as { progress?: RoadmapProgress | null };
    const remote =
      data.progress && isValidRoadmapProgress(data.progress) ? data.progress : null;
    const merged = mergeRoadmapProgress(local, remote);

    if (merged) {
      saveRoadmapProgress(merged, { skipServerSync: true });
      if (!remote || merged.completedDays.length > (remote.completedDays?.length ?? 0)) {
        void syncRoadmapProgressToServer(merged);
      }
    } else if (local) {
      void syncRoadmapProgressToServer(local);
    }

    return loadRoadmapProgress();
  } catch {
    if (local) void syncRoadmapProgressToServer(local);
    return local;
  }
}
