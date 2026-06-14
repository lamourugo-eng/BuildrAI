'use client';

import type { CitySnapshot } from '@/lib/city/engine';
import CityHud from '@/components/city/CityHud';
import FounderCharacter from '@/components/city/FounderCharacter';
import IsoBuilding from '@/components/city/IsoBuilding';
import IsoTile from '@/components/city/IsoTile';
import IsoAmbience from '@/components/city/IsoAmbience';
import {
  gridToScreen,
  ISO_HERO,
  generateGridTiles,
  getIsoSlot,
} from '@/lib/city/iso-layout';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';

interface CityWorldProps {
  snapshot: CitySnapshot;
  newBuildingIds?: string[];
  compact?: boolean;
  contain?: boolean;
  celebrating?: boolean;
}

export default function CityWorld({
  snapshot,
  newBuildingIds = [],
  compact = false,
  contain = false,
  celebrating = false,
}: CityWorldProps) {
  const tier = snapshot.level.visualTier;
  const [pulseUnlock, setPulseUnlock] = useState(false);

  const unlockedIds = useMemo(
    () => new Set(snapshot.buildings.filter((b) => b.unlocked).map((b) => b.id)),
    [snapshot.buildings]
  );

  const unlockedBuildings = useMemo(
    () => snapshot.buildings.filter((b) => b.unlocked && b.id !== 'foundation'),
    [snapshot.buildings]
  );

  const ghostBuildings = useMemo(
    () =>
      compact
        ? []
        : snapshot.buildings.filter((b) => !b.unlocked && b.id !== 'foundation'),
    [snapshot.buildings, compact]
  );

  const heroPos = gridToScreen(ISO_HERO.gx, ISO_HERO.gy, compact);
  const gridTiles = useMemo(() => generateGridTiles(), []);

  useEffect(() => {
    if (newBuildingIds.length > 0) {
      setPulseUnlock(true);
      const t = setTimeout(() => setPulseUnlock(false), 2800);
      return () => clearTimeout(t);
    }
  }, [newBuildingIds.join(',')]);

  return (
    <div
      className={[
        'city-world',
        'city-world--iso',
        `city-world--${snapshot.level.scene}`,
        `city-world--tier-${tier}`,
        compact ? 'city-world--compact' : '',
        contain ? 'city-world--contain' : '',
        pulseUnlock || celebrating ? 'city-world--celebrating' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--city-accent': snapshot.level.accent } as CSSProperties}
    >
      <div className="city-world-sky" aria-hidden="true">
        <span className="city-world-glow" />
        <span className="city-iso-cloud city-iso-cloud--a" />
        <span className="city-iso-cloud city-iso-cloud--b" />
        <span className="city-iso-horizon" />
        {tier === 'advanced' && <span className="city-world-stars" />}
      </div>

      <CityHud snapshot={snapshot} compact={compact} />

      <div className="city-iso-viewport">
        <div className={`city-iso-scene${compact ? ' city-iso-scene--compact' : ''}`}>
          {gridTiles.map(({ gx, gy, key }) => (
            <IsoTile key={key} gx={gx} gy={gy} compact={compact} />
          ))}

          <IsoAmbience
            compact={compact}
            tier={tier}
            unlockedCount={snapshot.unlockedBuildingCount}
          />

          {ghostBuildings.map((building) => {
            const slot = getIsoSlot(building.id);
            return (
              <IsoTile
                key={`ghost-${building.id}`}
                gx={slot.gx}
                gy={slot.gy}
                compact={compact}
                isGhost
              />
            );
          })}

          {unlockedBuildings.map((building, index) => (
            <IsoBuilding
              key={building.id}
              building={building}
              compact={compact}
              isNew={newBuildingIds.includes(building.id)}
              appearIndex={index}
            />
          ))}

          {unlockedIds.has('foundation') && (() => {
            const foundation = snapshot.buildings.find((b) => b.id === 'foundation');
            if (!foundation?.unlocked) return null;
            return (
              <IsoBuilding
                key="foundation"
                building={foundation}
                compact={compact}
                isNew={newBuildingIds.includes('foundation')}
                appearIndex={0}
              />
            );
          })()}

          <div
            className="iso-hero-plaza"
            style={{
              left: heroPos.x,
              top: heroPos.y,
              zIndex: heroPos.zIndex + 30,
            }}
          >
            <span className="iso-hero-plaza-glow" aria-hidden="true" />
            <div className="iso-hero-platform">
              {snapshot.avatar ? (
                <FounderCharacter
                  avatar={snapshot.avatar}
                  levelId={snapshot.level.id}
                  visualTier={tier}
                  celebrating={pulseUnlock || celebrating}
                  compact={compact}
                  showBadge={!compact}
                  showEvolutionHint={false}
                />
              ) : (
                <div className="founder-character-placeholder">
                  <span>?</span>
                  {!compact && <p>Créez votre personnage</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!compact && (
        <p className="city-world-tagline city-world-tagline--empire">
          {snapshot.unlockedBuildingCount <= 2
            ? 'Votre empire naît. Posez les premières pierres de votre parcours.'
            : snapshot.level.tagline}
        </p>
      )}

      {pulseUnlock && newBuildingIds.length > 0 && !compact && (
        <div className="city-unlock-banner city-unlock-banner--empire" role="status">
          <span className="city-unlock-banner-spark" aria-hidden="true" />
          <strong>Nouveau district construit !</strong>
          <span>
            {snapshot.buildings
              .filter((b) => newBuildingIds.includes(b.id))
              .map((b) => b.name)
              .join('. ')}
          </span>
        </div>
      )}
    </div>
  );
}
