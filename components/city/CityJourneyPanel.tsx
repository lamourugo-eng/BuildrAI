import type { CitySnapshot } from '@/lib/city/engine';
import Link from 'next/link';
import type { CSSProperties } from 'react';

interface CityJourneyPanelProps {
  snapshot: CitySnapshot;
}

function CoachIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3a7 7 0 0 1 7 7v2a3 3 0 0 1-3 3h-1.2l-1.8 2.4a1 1 0 0 1-1.6-.8V15H8a3 3 0 0 1-3-3v-2a7 7 0 0 1 7-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M9 10h6M9 7h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4h12v16H6V4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function CityJourneyPanel({ snapshot }: CityJourneyPanelProps) {
  const nextLocked = snapshot.buildings.find((b) => !b.unlocked);
  const districtPct = Math.round(
    (snapshot.unlockedBuildingCount / Math.max(snapshot.buildings.length, 1)) * 100
  );

  return (
    <section
      className="city-journey-panel city-journey-panel--premium"
      aria-labelledby="city-journey-title"
      style={{ '--city-journey-accent': snapshot.level.accent } as CSSProperties}
    >
      <header className="city-journey-head">
        <div>
          <span className="city-journey-eyebrow">Objectifs</span>
          <h3 id="city-journey-title">Prochaine expansion</h3>
          <p>{snapshot.motivationHint}</p>
        </div>
        <div className="city-journey-head-badge">
          <span>{snapshot.level.id}</span>
          <small>{snapshot.level.name}</small>
        </div>
      </header>

      <div className="city-journey-metrics">
        <div className="city-journey-metric">
          <div className="city-journey-metric-head">
            <span>Ville</span>
            <strong>
              {snapshot.progressToNext}
              <span>%</span>
            </strong>
          </div>
          <div className="city-journey-metric-track">
            <div
              className="city-journey-metric-fill city-journey-metric-fill--city"
              style={{ width: `${snapshot.nextLevel ? snapshot.progressToNext : 100}%` }}
            />
          </div>
          <p>Progression vers le niveau suivant</p>
        </div>

        <Link href="/espace?section=parcours" className="city-journey-metric-link">
          <div className="city-journey-metric">
            <div className="city-journey-metric-head">
              <span>Parcours</span>
              <strong>
                {snapshot.roadmapProgress}
                <span>%</span>
              </strong>
            </div>
            <div className="city-journey-metric-track">
              <div
                className="city-journey-metric-fill city-journey-metric-fill--roadmap"
                style={{ width: `${snapshot.roadmapProgress}%` }}
              />
            </div>
            <p>Plan 180 jours synchronisé</p>
          </div>
        </Link>

        <div className="city-journey-metric">
          <div className="city-journey-metric-head">
            <span>Districts</span>
            <strong>
              {districtPct}
              <span>%</span>
            </strong>
          </div>
          <div className="city-journey-metric-track">
            <div
              className="city-journey-metric-fill city-journey-metric-fill--districts"
              style={{ width: `${districtPct}%` }}
            />
          </div>
          <p>
            {snapshot.unlockedBuildingCount}/{snapshot.buildings.length} zones actives
          </p>
        </div>
      </div>

      {nextLocked ? (
        <div className="city-next-unlock city-next-unlock--premium">
          <span className="city-next-unlock-glow" aria-hidden="true" />
          <span className="city-next-unlock-icon" aria-hidden="true">
            {nextLocked.icon}
          </span>
          <div className="city-next-unlock-body">
            <span className="city-next-unlock-kicker">Événement à débloquer</span>
            <strong>{nextLocked.name}</strong>
            <p>{nextLocked.description}</p>
          </div>
        </div>
      ) : (
        <p className="city-journey-done">Empire à jour. Poursuis ton parcours pour de nouveaux districts.</p>
      )}

      <div className="city-journey-links city-journey-links--premium">
        <Link href="/espace?section=coach" className="city-btn city-btn--ghost">
          <CoachIcon />
          Coach IA
        </Link>
        <Link href="/espace?section=parcours" className="city-btn city-btn--primary">
          <PlanIcon />
          Mon plan
        </Link>
      </div>
    </section>
  );
}
