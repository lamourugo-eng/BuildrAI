import type { CitySnapshot } from '@/lib/city/engine';

interface CityHudProps {
  snapshot: CitySnapshot;
  compact?: boolean;
}

function StreakIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2c1.2 3.2 3.8 4.8 3.8 8.2 0 2.2-1.4 3.8-3.2 3.8-1.2 0-2.2-.6-2.8-1.5C9.2 14.4 8 15.8 6.2 15.8 3.8 15.8 2 13.6 2 11c0-4.8 4.2-7.4 6.8-9 1 .8 2.2 1.4 3.2 2.2V2Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

export default function CityHud({ snapshot, compact }: CityHudProps) {
  return (
    <div className={`city-hud city-hud--v2 city-hud--minimal${compact ? ' city-hud--compact' : ''}`}>
      <div className="city-hud-chip city-hud-chip--level">
        <strong>
          Niv. {snapshot.level.id}
          <span className="city-hud-chip-sep" aria-hidden="true">
            ·
          </span>
          {snapshot.level.name}
        </strong>
      </div>

      <div className="city-hud-chip city-hud-chip--streak" title="Jours consécutifs d'activité">
        <StreakIcon />
        <span>{snapshot.streakDays}j</span>
      </div>
    </div>
  );
}
