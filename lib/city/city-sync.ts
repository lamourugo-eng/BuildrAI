import type { FounderAvatar } from '@/lib/city/avatar-data';
import { isCompleteAvatar } from '@/lib/city/avatar-data';
import { emitCityRefresh } from '@/lib/city/events';
import {
  loadCityStorage,
  type CityStorageData,
} from '@/lib/city/storage';

function isValidCityStorage(raw: unknown): raw is CityStorageData {
  if (!raw || typeof raw !== 'object') return false;
  const data = raw as Partial<CityStorageData>;
  if (data.avatar != null && !isCompleteAvatar(data.avatar)) return false;
  return true;
}

function mergeCityStorage(local: CityStorageData, remote: CityStorageData): CityStorageData {
  const remoteAvatar = remote.avatar && isCompleteAvatar(remote.avatar) ? remote.avatar : null;
  const localAvatar = local.avatar && isCompleteAvatar(local.avatar) ? local.avatar : null;

  const remoteUpdated = remoteAvatar?.updatedAt
    ? new Date(remoteAvatar.updatedAt).getTime()
    : 0;
  const localUpdated = localAvatar?.updatedAt
    ? new Date(localAvatar.updatedAt).getTime()
    : 0;

  const avatar =
    remoteUpdated > localUpdated ? remoteAvatar : localAvatar ?? remoteAvatar;

  return {
    avatar,
    welcomeBonusClaimed: local.welcomeBonusClaimed || remote.welcomeBonusClaimed,
    lastSeenBuildingIds:
      local.lastSeenBuildingIds.length >= remote.lastSeenBuildingIds.length
        ? local.lastSeenBuildingIds
        : remote.lastSeenBuildingIds,
  };
}

function applyCityStorage(data: CityStorageData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('buildrai_city', JSON.stringify(data));
  emitCityRefresh();
}

export async function syncCityDataToServer(data?: CityStorageData): Promise<boolean> {
  const payload = data ?? loadCityStorage();

  try {
    const res = await fetch('/api/user/city-data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cityStorage: payload }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function hydrateCityDataFromServer(): Promise<CityStorageData> {
  const local = loadCityStorage();

  try {
    const res = await fetch('/api/user/city-data', { method: 'GET', cache: 'no-store' });

    if (res.status === 401) {
      return local;
    }

    if (!res.ok) {
      if (local.avatar) void syncCityDataToServer(local);
      return local;
    }

    const data = (await res.json()) as { cityStorage?: CityStorageData | null };
    const remote = data.cityStorage && isValidCityStorage(data.cityStorage) ? data.cityStorage : null;

    if (remote) {
      const merged = mergeCityStorage(local, remote);
      applyCityStorage(merged);
      if (
        (local.avatar && !remote.avatar) ||
        (local.avatar?.updatedAt && remote.avatar?.updatedAt &&
          new Date(local.avatar.updatedAt).getTime() > new Date(remote.avatar.updatedAt).getTime())
      ) {
        void syncCityDataToServer(merged);
      }
      return merged;
    }

    if (local.avatar) {
      void syncCityDataToServer(local);
    }

    return local;
  } catch {
    if (local.avatar) void syncCityDataToServer(local);
    return local;
  }
}

export type { FounderAvatar };
