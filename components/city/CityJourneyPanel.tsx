import type { CitySnapshot } from '@/lib/city/engine';
import Link from 'next/link';

interface CityJourneyPanelProps {
  snapshot: CitySnapshot;
}

export default function CityJourneyPanel({ snapshot }: CityJourneyPanelProps) {
  const nextLocked = snapshot.buildings.find((b) => !b.unlocked);

  return (
    <section className="city-journey-panel city-journey-panel--simple" aria-labelledby="city-journey-title">
      <header className="city-journey-head city-journey-head--simple">
        <h3 id="city-journey-title">Prochaine étape</h3>
        <p>Utilise le coach et ton parcours : ta ville grandit toute seule.</p>
      </header>

      {nextLocked ? (
        <div className="city-next-unlock city-next-unlock--simple">
          <span className="city-next-unlock-icon" aria-hidden="true">
            {nextLocked.icon}
          </span>
          <div className="city-next-unlock-body">
            <strong>{nextLocked.name}</strong>
            <p>{nextLocked.description}</p>
          </div>
        </div>
      ) : (
        <p className="city-journey-done">Ta ville est complète pour l&apos;instant. Continue ton parcours.</p>
      )}

      <div className="city-journey-links">
        <Link href="/espace?section=coach" className="btn btn-ghost btn-sm">
          Coach IA
        </Link>
        <Link href="/espace?section=parcours" className="btn btn-primary btn-sm">
          Mon plan
        </Link>
      </div>
    </section>
  );
}
