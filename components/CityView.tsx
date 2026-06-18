'use client';

import CityJourneyPanel from '@/components/city/CityJourneyPanel';
import CityWorld from '@/components/city/CityWorld';
import FounderCustomizer from '@/components/city/FounderCustomizer';
import { profileFromBusinessId } from '@/lib/city/avatar-data';
import { useCitySnapshot } from '@/lib/city/use-city-snapshot';
import { loadChosenBusiness, loadQuizProfile } from '@/lib/quiz/profile-storage';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';

interface CityViewProps {
  isSubscribed: boolean;
}

function resolveDefaultProfile() {
  const businessId = loadChosenBusiness() ?? loadQuizProfile()?.topBusinessId;
  return businessId ? profileFromBusinessId(businessId) : 'tech';
}

function CustomizeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface CityShellHeaderProps {
  city: ReturnType<typeof useCitySnapshot>['snapshot'];
  onCustomize: () => void;
  locked?: boolean;
}

function CityShellHeader({ city, onCustomize, locked }: CityShellHeaderProps) {
  const districtPct = Math.round(
    (city.unlockedBuildingCount / Math.max(city.buildings.length, 1)) * 100
  );

  return (
    <header
      className="city-shell-hero city-shell-hero--premium"
      style={{ '--city-shell-accent': city.level.accent } as CSSProperties}
    >
      <span className="city-shell-hero-glow" aria-hidden="true" />
      <span className="city-shell-hero-grid" aria-hidden="true" />

      <div className="city-shell-hero-main">
        <div className="city-shell-hero-copy">
          <div className="city-shell-hero-title-row">
            <span className="city-shell-eyebrow">Ma ville</span>
            <span className="city-shell-level-pill">
              Niv. {city.level.id}
            </span>
          </div>
          <h2>
            {locked ? 'Ton personnage est prêt' : city.level.name}
          </h2>
          <p>
            {locked
              ? 'Passe Premium pour voir ta civilisation évoluer avec ton parcours.'
              : city.accomplishmentSummary || city.level.tagline}
          </p>
        </div>

        <div className="city-shell-hero-actions">
          <button type="button" className="city-btn city-btn--glass" onClick={onCustomize}>
            <CustomizeIcon />
            Personnaliser
          </button>
        </div>
      </div>

      <div className="city-shell-stats city-shell-stats--premium">
        <div className="city-shell-stat">
          <strong>{city.unlockedBuildingCount}</strong>
          <span>Districts</span>
        </div>
        <div className="city-shell-stat">
          <strong>{districtPct}%</strong>
          <span>Empire</span>
        </div>
        <div className="city-shell-stat">
          <strong>{city.roadmapProgress}%</strong>
          <span>Parcours</span>
        </div>
        <div className="city-shell-stat city-shell-stat--accent">
          <strong>{city.streakDays}j</strong>
          <span>Série</span>
        </div>
      </div>
    </header>
  );
}

export default function CityView({ isSubscribed }: CityViewProps) {
  const searchParams = useSearchParams();
  const { snapshot: city, newBuildingIds, refresh } = useCitySnapshot(isSubscribed);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const defaultProfile = useMemo(() => resolveDefaultProfile(), [city.hasAvatar]);

  useEffect(() => {
    if (searchParams.get('edit') === 'entrepreneur' && city.hasAvatar) {
      setShowCustomizer(true);
    }
  }, [searchParams, city.hasAvatar]);

  function openCustomizer() {
    setShowCustomizer(true);
  }

  function closeCustomizer() {
    setShowCustomizer(false);
  }

  function onCustomizerComplete() {
    closeCustomizer();
    refresh();
  }

  const shellStyle = { '--city-shell-accent': city.level.accent } as CSSProperties;

  if (!city.hasAvatar) {
    return (
      <div className="account-panel city-view city-view--premium city-view--onboarding">
        <div className="city-ambient-bg" aria-hidden="true" />
        <FounderCustomizer
          key="onboarding"
          variant="onboarding"
          defaultProfile={defaultProfile}
          playerLevelId={city.level.id}
          onComplete={onCustomizerComplete}
        />
      </div>
    );
  }

  const editCustomizer = showCustomizer && (
    <FounderCustomizer
      key={`edit-${city.avatar?.updatedAt ?? 'edit'}-${city.level.id}`}
      variant="edit"
      defaultProfile={city.avatar?.profile ?? defaultProfile}
      initialAvatar={city.avatar}
      playerLevelId={city.level.id}
      onComplete={onCustomizerComplete}
      onCancel={closeCustomizer}
    />
  );

  if (!isSubscribed) {
    return (
      <div
        className="account-panel city-view city-view--premium city-view--locked"
        style={shellStyle}
      >
        <div className="city-ambient-bg" aria-hidden="true" />
        <CityShellHeader city={city} onCustomize={openCustomizer} locked />

        {editCustomizer}

        <div className="city-shell-world city-shell-world--premium">
          <CityWorld snapshot={city} />
        </div>

        <div className="city-locked-cta city-locked-cta--premium">
          <p>Abonne-toi pour débloquer la progression de ta ville avec le coach et le parcours.</p>
          <Link href="/subscribe?plan=starter&period=monthly" className="city-btn city-btn--primary">
            Voir les formules
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="account-panel city-view city-view--premium" style={shellStyle}>
      <div className="city-ambient-bg" aria-hidden="true" />

      <CityShellHeader city={city} onCustomize={openCustomizer} />

      {editCustomizer}

      <div className="city-shell-world city-shell-world--premium">
        <CityWorld snapshot={city} newBuildingIds={newBuildingIds} />
      </div>

      <CityJourneyPanel snapshot={city} />
    </div>
  );
}
