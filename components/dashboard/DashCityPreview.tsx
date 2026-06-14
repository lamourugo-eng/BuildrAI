'use client';

import CitySceneCompact from '@/components/city/CitySceneCompact';
import type { CitySnapshot } from '@/lib/city/engine';
import type { CSSProperties } from 'react';

interface DashCityPreviewProps {
  city: CitySnapshot;
  newBuildingIds?: string[];
  onOpen: () => void;
}

export default function DashCityPreview({
  city,
  newBuildingIds = [],
  onOpen,
}: DashCityPreviewProps) {
  const accent = city.level.accent;
  const empirePct = Math.round((city.unlockedBuildingCount / city.buildings.length) * 100);

  return (
    <section
      className="dash-city-preview dash-city-preview--v2 dash-city-preview--card"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      aria-label="Ouvrir ma ville"
      style={{ '--dash-city-accent': accent } as CSSProperties}
    >
      <div className="dash-city-preview-glow" aria-hidden="true" />

      <div className="dash-city-preview-head">
        <div className="dash-city-preview-title">
          <span className="dash-city-preview-eyebrow">Ma ville</span>
          <h3>
            {city.hasAvatar
              ? `${city.level.name}. Niv. ${city.level.id}`
              : 'Crée ton personnage'}
          </h3>
        </div>

        {city.hasAvatar ? (
          <div className="dash-city-preview-chips">
            <span>{city.accomplishments.length} étapes</span>
            <span>
              {city.unlockedBuildingCount}/{city.buildings.length}
            </span>
            <span>{empirePct}%</span>
          </div>
        ) : (
          <p className="dash-city-preview-meta">Personnalisation gratuite</p>
        )}
      </div>

      {city.hasAvatar ? (
        <div className="dash-city-preview-scene-wrap">
          <div className="dash-city-preview-scene">
            <div className="dash-city-preview-scene-viewport">
              <CitySceneCompact snapshot={city} newBuildingIds={newBuildingIds} contain />
              {city.nextLevel && (
                <div className="dash-city-preview-xp-overlay" aria-hidden="true">
                  <div
                    className="dash-city-preview-xp-fill"
                    style={{ width: `${city.progressToNext}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="dash-city-preview-empty">
          <p>Crée ton avatar pour afficher ton empire isométrique.</p>
        </div>
      )}

      <div className="dash-city-preview-foot">
        <span className="dash-city-preview-link">
          {city.hasAvatar ? 'Ouvrir ma ville →' : 'Commencer →'}
        </span>
      </div>
    </section>
  );
}
