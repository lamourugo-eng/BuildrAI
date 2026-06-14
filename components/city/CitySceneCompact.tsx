'use client';

import CityWorld from '@/components/city/CityWorld';
import type { CitySnapshot } from '@/lib/city/engine';

interface CitySceneCompactProps {
  snapshot: CitySnapshot;
  newBuildingIds?: string[];
  /** Réduit et cadre la scène pour l’aperçu dashboard (plan entier visible). */
  contain?: boolean;
}

/** Aperçu léger. Ne monte pas CityView (pas de polling dupliqué) */
export default function CitySceneCompact({
  snapshot,
  newBuildingIds = [],
  contain = false,
}: CitySceneCompactProps) {
  return (
    <CityWorld
      snapshot={snapshot}
      newBuildingIds={newBuildingIds}
      compact
      contain={contain}
    />
  );
}
