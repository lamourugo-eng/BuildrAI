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

function DistrictIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20V10l8-6 8 6v10H4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 20v-5h6v5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function RoadmapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16M4 12h10M4 18h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function CityHud({ snapshot, compact }: CityHudProps) {
  const totalDistricts = snapshot.buildings.length;
  const xpLabel = snapshot.nextLevel
    ? `${snapshot.progressToNext}% vers niv. ${snapshot.nextLevel.id}`
    : 'Niveau max';

  return (
    <div className={`city-hud city-hud--v2 city-hud--premium${compact ? ' city-hud--compact' : ''}`}>
      <div className="city-hud-chip city-hud-chip--level">
        <span className="city-hud-chip-kicker">Civilisation</span>
        <strong>
          <span className="city-hud-level-num">Niv. {snapshot.level.id}</span>
          <span className="city-hud-chip-sep" aria-hidden="true">
            ·
          </span>
          {snapshot.level.name}
        </strong>
      </div>

      {!compact && (
        <div className="city-hud-chip city-hud-chip--xp">
          <div className="city-hud-xp-top">
            <span>Expansion</span>
            <span>{xpLabel}</span>
          </div>
          <div className="city-hud-xp-track" role="progressbar" aria-valuenow={snapshot.progressToNext}>
            <div
              className="city-hud-xp-fill"
              style={{
                width: `${snapshot.nextLevel ? snapshot.progressToNext : 100}%`,
                background: `linear-gradient(90deg, ${snapshot.level.accent}, #a78bfa)`,
              }}
            />
          </div>
        </div>
      )}

      <div className="city-hud-chip city-hud-chip--districts">
        <DistrictIcon />
        <span className="city-hud-districts-text">
          <strong>
            {snapshot.unlockedBuildingCount}/{totalDistricts}
          </strong>
          <span>Districts</span>
        </span>
      </div>

      {!compact && (
        <div className="city-hud-chip city-hud-chip--roadmap" title="Progression parcours">
          <RoadmapIcon />
          <span className="city-hud-districts-text">
            <strong>{snapshot.roadmapProgress}%</strong>
            <span>Plan</span>
          </span>
        </div>
      )}

      <div className="city-hud-chip city-hud-chip--streak" title="Jours consécutifs d'activité">
        <StreakIcon />
        <span>{snapshot.streakDays}j</span>
      </div>
    </div>
  );
}
