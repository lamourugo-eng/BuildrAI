'use client';

import CityJourneyPanel from '@/components/city/CityJourneyPanel';
import CityWorld from '@/components/city/CityWorld';
import CityXpGuide from '@/components/city/CityXpGuide';
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
  isSubscribed: boolean;
  onCustomize: () => void;
  locked?: boolean;
}

function CityShellHeader({ city, isSubscribed, onCustomize, locked }: CityShellHeaderProps) {
  const empirePct = Math.round((city.unlockedBuildingCount / city.buildings.length) * 100);

  return (
    <header
      className="city-shell-hero"
      style={{ '--city-shell-accent': city.level.accent } as CSSProperties}
    >
      <div className="city-shell-hero-glow" aria-hidden="true" />
      <div className="city-shell-hero-main">
        <div className="city-shell-hero-copy">
          <span className="city-shell-eyebrow">Ma ville</span>
          <h2>
            {locked ? 'Ton empire en construction' : `${city.level.name}. Niv. ${city.level.id}`}
          </h2>
          <p>
            {locked
              ? 'Ton personnage est prêt. Abonne-toi pour débloquer la progression complète (districts, coach, parcours).'
              : city.accomplishmentSummary}
          </p>
        </div>

        <div className="city-shell-hero-actions">
          <button type="button" className="city-shell-btn" onClick={onCustomize}>
            <CustomizeIcon />
            Personnaliser
          </button>
        </div>
      </div>

      {isSubscribed && !locked && (
        <div className="city-shell-stats">
          <div className="city-shell-stat">
            <strong>{city.accomplishments.length}</strong>
            <span>étapes validées</span>
          </div>
          <div className="city-shell-stat">
            <strong>
              {city.unlockedBuildingCount}/{city.buildings.length}
            </strong>
            <span>districts</span>
          </div>
          <div className="city-shell-stat">
            <strong>{city.streakDays}j</strong>
            <span>série</span>
          </div>
          <div className="city-shell-stat">
            <strong>{empirePct}%</strong>
            <span>construit</span>
          </div>
        </div>
      )}
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

  if (!city.hasAvatar) {
    return (
      <div className="account-panel city-view city-view--onboarding">
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
        className="account-panel city-view city-view--locked"
        style={{ '--city-shell-accent': city.level.accent } as CSSProperties}
      >
        <CityShellHeader
          city={city}
          isSubscribed={isSubscribed}
          onCustomize={openCustomizer}
          locked
        />

        {editCustomizer}

        <div className="city-shell-world">
          <CityWorld snapshot={city} />
        </div>

        <div className="city-locked-cta">
          <div className="city-locked-cta-copy">
            <strong>Débloque la progression empire</strong>
            <p>
              Districts, streaks et tenues évolutives. Tout s&apos;active avec l&apos;abonnement
              Premium.
            </p>
            <ul>
              <li>Districts qui apparaissent au fil de tes actions</li>
              <li>Étapes business concrètes et déblocages personnage</li>
              <li>Suivi parcours &amp; coach intégré à la ville</li>
            </ul>
          </div>
          <Link href="/subscribe?plan=starter&period=monthly" className="btn btn-primary">
            S&apos;abonner pour construire ma ville
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="account-panel city-view"
      style={{ '--city-shell-accent': city.level.accent } as CSSProperties}
    >
      <CityShellHeader city={city} isSubscribed={isSubscribed} onCustomize={openCustomizer} />

      {editCustomizer}

      <div className="city-shell-world">
        <CityWorld snapshot={city} newBuildingIds={newBuildingIds} />
      </div>

      <CityJourneyPanel snapshot={city} />

      <CityXpGuide />
    </div>
  );
}
