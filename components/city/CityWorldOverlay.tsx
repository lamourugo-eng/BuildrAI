import type { CitySnapshot } from '@/lib/city/engine';

interface CityWorldOverlayProps {
  snapshot: CitySnapshot;
}

export default function CityWorldOverlay({ snapshot }: CityWorldOverlayProps) {
  const nextLocked = snapshot.buildings.find((b) => !b.unlocked);
  const districtPct = Math.round(
    (snapshot.unlockedBuildingCount / Math.max(snapshot.buildings.length, 1)) * 100
  );

  return (
    <>
      <aside className="city-world-rail city-world-rail--left" aria-label="Ressources de la ville">
        <div className="city-world-rail-card">
          <span className="city-world-rail-label">Ressources</span>
          <ul className="city-world-rail-list">
            <li>
              <span>Districts</span>
              <strong>
                {snapshot.unlockedBuildingCount}
                <small>/{snapshot.buildings.length}</small>
              </strong>
            </li>
            <li>
              <span>Empire</span>
              <strong>{districtPct}%</strong>
            </li>
            <li>
              <span>Série</span>
              <strong>{snapshot.streakDays}j</strong>
            </li>
          </ul>
        </div>
      </aside>

      <aside className="city-world-rail city-world-rail--right" aria-label="Objectifs">
        {nextLocked ? (
          <div className="city-world-rail-card city-world-rail-card--event">
            <span className="city-world-rail-label">Prochain objectif</span>
            <div className="city-world-rail-event-head">
              <span className="city-world-rail-event-icon" aria-hidden="true">
                {nextLocked.icon}
              </span>
              <strong>{nextLocked.name}</strong>
            </div>
            <p>{nextLocked.description}</p>
          </div>
        ) : (
          <div className="city-world-rail-card city-world-rail-card--complete">
            <span className="city-world-rail-label">État</span>
            <strong>Empire complet</strong>
            <p>Tous les districts sont actifs. Continue ton parcours pour faire évoluer ta civilisation.</p>
          </div>
        )}
      </aside>
    </>
  );
}
