import { CITY_XP } from '@/lib/city/data';

const XP_ACTIONS = [
  { xp: CITY_XP.quiz, label: 'Quiz entrepreneurial' },
  { xp: CITY_XP.welcomeBonus, label: 'Activation Premium' },
  { xp: CITY_XP.perCoachMessage, label: 'Message au coach' },
  { xp: CITY_XP.perRoadmapDay, label: 'Jour coché dans le parcours' },
  { xp: CITY_XP.perWeeklyAnalysis, label: 'Analyse hebdomadaire' },
] as const;

const APPEARANCE_UNLOCKS = [
  'Niv. 2. Café, lunettes, style startup',
  'Niv. 4. Tablette, look audacieux',
  'Niv. 5. Costume & accessoires premium',
] as const;

export default function CityXpGuide() {
  return (
    <section className="city-xp-guide" aria-labelledby="city-xp-guide-title">
      <div className="city-xp-guide-head">
        <div>
          <h3 id="city-xp-guide-title">Comment gagner de l&apos;XP empire</h3>
          <p>Chaque action dans BuildrAI alimente votre progression et débloque districts &amp; tenues.</p>
        </div>
      </div>

      <ul className="city-xp-guide-grid">
        {XP_ACTIONS.map((action) => (
          <li key={action.label} className="city-xp-guide-item">
            <span className="city-xp-guide-value">+{action.xp} XP</span>
            <span className="city-xp-guide-label">{action.label}</span>
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
