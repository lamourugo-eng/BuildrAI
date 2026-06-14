import type { CitySnapshot } from '@/lib/city/engine';
import Link from 'next/link';

interface CityJourneyPanelProps {
  snapshot: CitySnapshot;
}

function ProgressStat({
  label,
  value,
  max,
  hint,
  href,
}: {
  label: string;
  value: number;
  max: number;
  hint: string;
  href?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  const body = (
    <article className="city-journey-metric">
      <div className="city-journey-metric-head">
        <span>{label}</span>
        <strong>
          {value}
          <span>/{max}</span>
        </strong>
      </div>
      <div className="city-journey-metric-track" aria-hidden="true">
        <div className="city-journey-metric-fill" style={{ width: `${pct}%` }} />
      </div>
      <p>{hint}</p>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="city-journey-metric-link">
        {body}
      </Link>
    );
  }

  return body;
}

export default function CityJourneyPanel({ snapshot }: CityJourneyPanelProps) {
  const nextLocked = snapshot.buildings.find((b) => !b.unlocked);
  const empirePct = Math.round(
    (snapshot.unlockedBuildingCount / snapshot.buildings.length) * 100
  );

  return (
    <section className="city-journey-panel" aria-labelledby="city-journey-title">
      <header className="city-journey-head">
        <div>
          <span className="city-journey-eyebrow">Progression empire</span>
          <h3 id="city-journey-title">Votre empire en chiffres</h3>
          <p>{snapshot.motivationHint}</p>
        </div>
        <div className="city-journey-head-badge">
          <span>{empirePct}%</span>
          <small>construit</small>
        </div>
      </header>

      <div className="city-journey-metrics">
        <ProgressStat
          label="Districts"
          value={snapshot.unlockedBuildingCount}
          max={snapshot.buildings.length}
          hint="Chaque bâtiment reflète une étape concrète de votre activité."
        />
        <ProgressStat
          label="Parcours"
          value={snapshot.roadmapProgress}
          max={100}
          hint="Jours cochés dans votre parcours premium."
          href="/espace?section=parcours"
        />
        <ProgressStat
          label="Coach"
          value={snapshot.coachingPhase}
          max={8}
          hint="Étape actuelle du plan en 8 phases."
          href="/espace?section=coach"
        />
      </div>

      <div className="city-journey-districts">
        <div className="city-journey-districts-head">
          <h4>Carte des districts</h4>
          <span>
            {snapshot.unlockedBuildingCount}/{snapshot.buildings.length} actifs
          </span>
        </div>
        <ul className="city-journey-district-list">
          {snapshot.buildings.map((building) => (
            <li
              key={building.id}
              className={`city-journey-district${building.unlocked ? ' is-unlocked' : ''}`}
              title={building.description}
            >
              <span className="city-journey-district-icon" aria-hidden="true">
                {building.icon}
              </span>
              <span className="city-journey-district-name">{building.name}</span>
              <span className="city-journey-district-state">
                {building.unlocked ? 'Actif' : 'À venir'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {nextLocked && (
        <div className="city-next-unlock">
          <div className="city-next-unlock-icon" aria-hidden="true">
            {nextLocked.icon}
          </div>
          <div className="city-next-unlock-body">
            <span className="city-next-unlock-label">Prochaine construction</span>
            <strong>{nextLocked.name}</strong>
            <p>{nextLocked.description}</p>
          </div>
        </div>
      )}
    </section>
  );
}
