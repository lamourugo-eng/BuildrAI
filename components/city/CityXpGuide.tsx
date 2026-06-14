import { CITY_PROGRESS_ACTIONS } from '@/lib/city/accomplishments';

const APPEARANCE_UNLOCKS = [
  'Niv. 2 · Café, lunettes, style startup',
  'Niv. 4 · Tablette, look audacieux',
  'Niv. 5 · Costume & accessoires premium',
] as const;

export default function CityXpGuide() {
  return (
    <section className="city-xp-guide" aria-labelledby="city-xp-guide-title">
      <div className="city-xp-guide-head">
        <div>
          <h3 id="city-xp-guide-title">Ce qui fait grandir votre empire</h3>
          <p>
            Chaque action dans BuildrAI se traduit en étape business concrète — pas en points
            abstraits.
          </p>
        </div>
      </div>

      <ul className="city-xp-guide-grid">
        {CITY_PROGRESS_ACTIONS.map((action) => (
          <li key={action.id} className="city-xp-guide-item">
            <span className="city-xp-guide-value">{action.outcome}</span>
            <span className="city-xp-guide-label">{action.action}</span>
          </li>
        ))}
      </ul>

      <div className="city-xp-guide-unlocks">
        <span className="city-xp-guide-unlocks-label">Déblocages personnage</span>
        <ul>
          {APPEARANCE_UNLOCKS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
