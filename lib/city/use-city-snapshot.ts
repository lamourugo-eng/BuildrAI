'use client';

import { loadAccountAnalytics } from '@/lib/account/analytics-storage';
import { getUnlockedRoadmapMonths, loadSubscriptionMeta } from '@/lib/account/subscription-storage';
import { getTotalUnlockedRoadmapDays } from '@/lib/quiz/roadmap-program';
import { CITY_REFRESH_EVENT } from '@/lib/city/events';
import { computeCitySnapshot, type CitySnapshot } from '@/lib/city/engine';
import {
  claimCityWelcomeBonus,
  getNewBuildingIds,
  markBuildingsSeen,
} from '@/lib/city/storage';
import { useCallback, useEffect, useState } from 'react';

const REFRESH_MS = 4000;

function buildSnapshot(isSubscribed: boolean): CitySnapshot {
  const subMeta = loadSubscriptionMeta();
  const unlockedDays = isSubscribed
    ? getTotalUnlockedRoadmapDays(getUnlockedRoadmapMonths(subMeta))
    : 30;
  return computeCitySnapshot(loadAccountAnalytics(), isSubscribed, unlockedDays);
}

export interface UseCitySnapshotOptions {
  /** Détecte les nouveaux bâtiments débloqués (toast / bannière) */
  trackNewBuildings?: boolean;
}

export function useCitySnapshot(
  isSubscribed: boolean,
  options: UseCitySnapshotOptions = {}
) {
  const trackNewBuildings = options.trackNewBuildings ?? isSubscribed;

  const [snapshot, setSnapshot] = useState(() => buildSnapshot(isSubscribed));
  const [newBuildingIds, setNewBuildingIds] = useState<string[]>([]);

  const refresh = useCallback(() => {
    const next = buildSnapshot(isSubscribed);
    setSnapshot(next);

    if (trackNewBuildings) {
      const unlockedIds = next.buildings.filter((b) => b.unlocked).map((b) => b.id);
      const fresh = getNewBuildingIds(unlockedIds);
      if (fresh.length > 0) {
        setNewBuildingIds((prev) => [...new Set([...prev, ...fresh])]);
      }
    }

    return next;
  }, [isSubscribed, trackNewBuildings]);

  const dismissNewBuildings = useCallback(() => {
    markBuildingsSeen(snapshot.buildings.filter((b) => b.unlocked).map((b) => b.id));
    setNewBuildingIds([]);
  }, [snapshot.buildings]);

  useEffect(() => {
    if (isSubscribed) claimCityWelcomeBonus();
    refresh();

    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('buildrai_')) refresh();
    };
    const onCustomRefresh = () => refresh();

    window.addEventListener('storage', onStorage);
    window.addEventListener(CITY_REFRESH_EVENT, onCustomRefresh);
    const interval = setInterval(refresh, REFRESH_MS);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CITY_REFRESH_EVENT, onCustomRefresh);
      clearInterval(interval);
    };
  }, [isSubscribed, refresh]);

  useEffect(() => {
    if (newBuildingIds.length === 0) return;
    const timer = setTimeout(dismissNewBuildings, 5000);
    return () => clearTimeout(timer);
  }, [newBuildingIds, dismissNewBuildings]);

  return { snapshot, newBuildingIds, refresh, dismissNewBuildings };
}
