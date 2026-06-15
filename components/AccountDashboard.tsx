'use client';

import AccountAnalytics from '@/components/AccountAnalytics';
import AssistanceSection from '@/components/AssistanceSection';
import AccountNotepad from '@/components/AccountNotepad';
import AccountProfile from '@/components/AccountProfile';
import CityView from '@/components/CityView';
import DashFounderPath from '@/components/dashboard/DashFounderPath';
import DashCityPreview from '@/components/dashboard/DashCityPreview';
import { DashMobileNav, DashSidebar } from '@/components/dashboard/DashWorkspaceNav';
import { useEntrepreneurCopy } from '@/components/EntrepreneurCopyProvider';
import AccountSubscription from '@/components/AccountSubscription';
import Coach from '@/components/Coach';
import { loadAccountAnalytics } from '@/lib/account/analytics-storage';
import { loadLocalNotepad, notepadPreview } from '@/lib/account/notepad-storage';
import { getPlanById } from '@/lib/stripe/plans';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import { loadChosenBusiness, loadQuizProfile } from '@/lib/quiz/profile-storage';
import { resolveActiveBusinessId } from '@/lib/quiz/resolve-active-business';
import { hydrateUserDataFromServer } from '@/lib/account/user-data-sync';
import { computeCitySnapshot } from '@/lib/city/engine';
import { CITY_REFRESH_EVENT } from '@/lib/city/events';
import {
  claimCityWelcomeBonus,
  getNewBuildingIds,
  markBuildingsSeen,
} from '@/lib/city/storage';
import FreeRoadmapTeaser from '@/components/FreeRoadmapTeaser';
import PremiumRoadmap from '@/components/PremiumRoadmap';
import Quiz from '@/components/Quiz';
import ResourceLibrary from '@/components/ResourceLibrary';
import WeeklyDeepAnalysis from '@/components/WeeklyDeepAnalysis';
import { getTotalUnlockedRoadmapDays } from '@/lib/quiz/roadmap-program';
import {
  getRoadmapCompletionPercent,
  loadRoadmapProgress,
} from '@/lib/account/roadmap-storage';
import {
  getUnlockedRoadmapMonths,
  loadSubscriptionMeta,
} from '@/lib/account/subscription-storage';
import { hasGrowthAccess } from '@/lib/account/feature-access';
import { syncRoadmapMonthsFromStripe } from '@/lib/account/roadmap-sync-client';
import {
  DASHBOARD_SECTIONS,
  resolveDashboardSection,
  type DashboardSection,
} from '@/lib/dashboard/sections';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useLayoutEffect, useState } from 'react';
import type { PlanId } from '@/lib/stripe';

export type { DashboardSection };

interface AccountDashboardProps {
  email: string;
  isSubscribed: boolean;
  serverPlanId?: PlanId | null;
  isGrowth?: boolean;
}

export default function AccountDashboard({
  email,
  isSubscribed,
  serverPlanId = null,
  isGrowth: isGrowthFromServer = false,
}: AccountDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = resolveDashboardSection(searchParams.get('section'));
  const wantsQuiz = searchParams.get('quiz') === '1';

  const [stats, setStats] = useState(loadAccountAnalytics());
  const [city, setCity] = useState(() =>
    computeCitySnapshot(loadAccountAnalytics(), isSubscribed)
  );
  const [profile, setProfile] = useState<ReturnType<typeof loadQuizProfile>>(null);
  const [chosenId, setChosenId] = useState<BusinessId | null>(null);
  const [newBuildings, setNewBuildings] = useState<string[]>([]);
  const [notepadSnippet, setNotepadSnippet] = useState('');
  const [planName, setPlanName] = useState('Premium');
  const [isGrowth, setIsGrowth] = useState(false);
  const [roadmapProgress, setRoadmapProgress] = useState(0);

  function refresh() {
    const analytics = loadAccountAnalytics();
    setStats(analytics);
    setProfile(loadQuizProfile());
    setChosenId(loadChosenBusiness());
    setNotepadSnippet(notepadPreview(loadLocalNotepad().content));
    const subMeta = loadSubscriptionMeta();
    const effectivePlanId = serverPlanId ?? subMeta.planId;
    setPlanName(getPlanById(effectivePlanId)?.name ?? 'Premium');
    setIsGrowth(hasGrowthAccess(isSubscribed, serverPlanId, subMeta) || isGrowthFromServer);
    const biz = resolveActiveBusinessId();
    const storedRoadmap = loadRoadmapProgress();
    const unlockedDays = isSubscribed
      ? getTotalUnlockedRoadmapDays(getUnlockedRoadmapMonths(subMeta))
      : 30;
    if (biz && storedRoadmap?.businessId === biz) {
      setRoadmapProgress(
        getRoadmapCompletionPercent(storedRoadmap.completedDays, unlockedDays)
      );
    } else {
      setRoadmapProgress(0);
    }
    const snapshot = computeCitySnapshot(analytics, isSubscribed, unlockedDays);
    setCity(snapshot);

    if (isSubscribed) {
      const unlockedIds = snapshot.buildings.filter((b) => b.unlocked).map((b) => b.id);
      const fresh = getNewBuildingIds(unlockedIds);
      if (fresh.length > 0) setNewBuildings(fresh);
    }
  }

  useLayoutEffect(() => {
    setProfile(loadQuizProfile());
    setChosenId(loadChosenBusiness());
  }, []);

  useEffect(() => {
    void hydrateUserDataFromServer().then(() => {
      refresh();
    });
  }, []);

  useEffect(() => {
    if (isSubscribed) {
      claimCityWelcomeBonus();
      void syncRoadmapMonthsFromStripe().then(() => refresh());
    }
    refresh();

    const onStorage = (e: StorageEvent) => {
      if (
        e.key === 'buildrai_account_analytics' ||
        e.key === 'buildrai_rewards' ||
        e.key?.startsWith('buildrai_')
      ) {
        refresh();
      }
    };
    const onQuizProfile = () => refresh();
    const onCityRefresh = () => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('buildrai:quiz-profile', onQuizProfile);
    window.addEventListener(CITY_REFRESH_EVENT, onCityRefresh);
    const interval = setInterval(refresh, 4000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('buildrai:quiz-profile', onQuizProfile);
      window.removeEventListener(CITY_REFRESH_EVENT, onCityRefresh);
      clearInterval(interval);
    };
  }, [isSubscribed, serverPlanId, isGrowthFromServer]);

  function finishQuizInEspace(nextSection: DashboardSection = 'profil') {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('quiz');
    if (nextSection === 'overview') params.delete('section');
    else params.set('section', nextSection);
    params.delete('upgrade');
    const qs = params.toString();
    router.replace(qs ? `/espace?${qs}` : '/espace', { scroll: false });
    refresh();
  }

  function goTo(next: DashboardSection, options?: { quiz?: boolean }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'overview') params.delete('section');
    else params.set('section', next);
    params.delete('upgrade');
    if (options?.quiz) params.set('quiz', '1');
    else params.delete('quiz');
    const qs = params.toString();
    router.replace(qs ? `/espace?${qs}` : '/espace', { scroll: false });
  }

  function goToAcceleratorUpgrade() {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', 'abonnement');
    params.set('upgrade', 'growth');
    router.replace(`/espace?${params.toString()}`, { scroll: false });
  }

  const coachProgress = Math.min(100, stats.coachMessages * 12);
  const planProgress = isSubscribed && roadmapProgress > 0 ? roadmapProgress : coachProgress;
  const activeId = resolveActiveBusinessId() ?? (profile ? ((chosenId ?? profile.topBusinessId) as BusinessId) : null);
  const activeBiz = activeId ? businessProfiles[activeId] : null;

  const unlockedBuildings = city.buildings.filter((b) => b.unlocked);
  const newBuildingDetails = city.buildings.filter((b) => newBuildings.includes(b.id));
  const currentSection = DASHBOARD_SECTIONS.find((s) => s.id === section)!;
  const { copy } = useEntrepreneurCopy();
  const currentSectionCopy = copy.sections[section];
  const firstName = email ? email.split('@')[0] : '';

  function dismissNewBuildings() {
    markBuildingsSeen(unlockedBuildings.map((b) => b.id));
    setNewBuildings([]);
  }

  const storedRoadmap = loadRoadmapProgress();
  const roadmapDays =
    activeId && storedRoadmap?.businessId === activeId ? storedRoadmap.completedDays : [];

  return (
    <div className="dash-shell dash-shell--live">
      <div className="dash-ambient" aria-hidden="true">
        <span className="dash-orb dash-orb--1" />
        <span className="dash-orb dash-orb--2" />
        <span className="dash-orb dash-orb--3" />
      </div>
      <DashSidebar
        activeSection={section}
        onNavigate={goTo}
        isSubscribed={isSubscribed}
        serverPlanId={serverPlanId}
        isGrowth={isGrowth}
        planLabel={isSubscribed ? planName : 'Gratuit'}
        progressLabel={isSubscribed ? `${planProgress}%` : undefined}
      />
      <div className="dash-body">
        <DashMobileNav
          activeSection={section}
          onNavigate={goTo}
          isSubscribed={isSubscribed}
          serverPlanId={serverPlanId}
          isGrowth={isGrowth}
          planLabel={isSubscribed ? planName : 'Gratuit'}
        />
        {newBuildingDetails.length > 0 && section !== 'ville' && (
          <div className="dash-toast" role="status">
            <span>
              {newBuildingDetails.map((b) => b.description).join(' · ')}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={dismissNewBuildings}>
              OK
            </button>
          </div>
        )}

        {section !== 'coach' && section !== 'overview' && (
          <header className="dash-page-header dash-page-header--live">
            <button
              type="button"
              className="dash-breadcrumb"
              onClick={() => goTo('overview')}
            >
              ← Accueil
            </button>
            <h1>{currentSectionCopy.label}</h1>
            <p>{currentSectionCopy.description}</p>
          </header>
        )}

        <div
          key={section}
          className={`dash-content dash-content--live${section === 'coach' ? ' dash-content--flush' : ''}`}
        >
          {section === 'overview' && (
            <div className="dash-overview dash-overview--modern dash-overview--clear">
              <section className="dash-hero dash-hero--hub dash-hero--slim">
                <div className="dash-hero-glow" aria-hidden="true" />
                <div className="dash-hero-inner">
                  <div className="dash-hero-main">
                    <p className="dash-hero-kicker">
                      <span className="dash-live-dot" aria-hidden="true" />
                      {copy.overview.kicker}
                      {firstName ? `. Bonjour, ${firstName}` : ''}
                    </p>
                    {isSubscribed ? (
                      <>
                        <h2>
                          {activeBiz ? (
                            <>
                              <span className="dash-hero-model-icon" aria-hidden="true">
                                {activeBiz.icon}
                              </span>
                              {activeBiz.name}
                            </>
                          ) : (
                            'Ton espace fondateur'
                          )}
                        </h2>
                        <p>{copy.overview.subscribedSubtitle}</p>
                        <div className="dash-hero-stats dash-hero-stats--slim">
                          <span className="dash-hero-stat">
                            <strong>{roadmapProgress}%</strong>
                            <span>{copy.overview.statRoadmap}</span>
                          </span>
                          <span className="dash-hero-stat">
                            <strong>{city.streakDays} j</strong>
                            <span>{copy.overview.statStreak}</span>
                          </span>
                          <span className="dash-hero-stat dash-hero-stat--muted">
                            <strong>{planName}</strong>
                            <span>{copy.overview.statPlan}</span>
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2>Plan gratuit. Ton profil est prêt</h2>
                        <p>{copy.overview.freeSubtitle}</p>
                        <div className="dash-hero-stats dash-hero-stats--slim">
                          <span className="dash-hero-stat">
                            <strong>{profile ? 'Profil OK' : 'Quiz'}</strong>
                            <span>{profile ? 'Complété' : 'À faire'}</span>
                          </span>
                          <span className="dash-hero-stat dash-hero-stat--muted">
                            <strong>180 j</strong>
                            <span>Parcours premium</span>
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  {isSubscribed ? (
                    <div className="dash-hero-actions">
                      <button type="button" className="btn btn-primary" onClick={() => goTo('parcours')}>
                        {copy.sections.parcours.label}
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => goTo('coach')}>
                        {copy.sections.coach.label}
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/subscribe?plan=starter&period=monthly"
                      className="btn btn-primary"
                    >
                      Débloquer le coach IA
                    </Link>
                  )}
                </div>
              </section>

              <section className="dash-overview-block dash-overview-block--today">
                <header className="dash-overview-block-head">
                  <h3>{copy.overview.todayTitle}</h3>
                  <p>{copy.overview.todaySubtitle}</p>
                </header>
                {isSubscribed ? (
                  <PremiumRoadmap
                    businessId={activeId}
                    isSubscribed={isSubscribed}
                    variant="compact"
                    onProgressChange={setRoadmapProgress}
                  />
                ) : (
                  profile && <FreeRoadmapTeaser profile={profile} variant="dashboard" />
                )}
                <DashFounderPath
                  isSubscribed={isSubscribed}
                  hasProfile={Boolean(profile || activeId)}
                  businessId={activeId}
                  coachMessages={stats.coachMessages}
                  roadmapProgress={roadmapProgress}
                  onGo={goTo}
                  variant="compact"
                />
              </section>

              {isSubscribed && (
                <section className="dash-overview-block dash-overview-block--primary">
                  <header className="dash-overview-block-head">
                    <h3>{copy.overview.primaryToolsTitle}</h3>
                    <p>{copy.overview.primaryToolsSubtitle}</p>
                  </header>
                  <div className="dash-overview-primary-grid">
                    <article
                      className="dash-card dash-card--tile dash-card--primary dash-card--tool"
                      onClick={() => goTo('coach')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && goTo('coach')}
                    >
                      <span className="dash-card-icon" aria-hidden="true">
                        ◈
                      </span>
                      <span className="dash-card-label">{copy.sections.coach.label}</span>
                      <p className="dash-card-value">Parler au coach</p>
                      <p className="dash-card-meta">{stats.coachMessages} messages échangés</p>
                    </article>
                    <article
                      className="dash-card dash-card--tile dash-card--primary dash-card--tool"
                      onClick={() => goTo('parcours')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && goTo('parcours')}
                    >
                      <span className="dash-card-icon" aria-hidden="true">
                        ◎
                      </span>
                      <span className="dash-card-label">{copy.sections.parcours.label}</span>
                      <p className="dash-card-value">
                        {roadmapProgress > 0 ? `${roadmapProgress}% complété` : 'Commencer'}
                      </p>
                      <p className="dash-card-meta">Plan 180 jours sur ton modèle</p>
                    </article>
                    <article
                      className="dash-card dash-card--tile dash-card--primary dash-card--tool"
                      onClick={() => goTo('ville')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && goTo('ville')}
                    >
                      <span className="dash-card-icon" aria-hidden="true">
                        🏙
                      </span>
                      <span className="dash-card-label">{copy.sections.ville.label}</span>
                      <p className="dash-card-value">
                        {city.hasAvatar ? city.level.name : 'Créer ton avatar'}
                      </p>
                      <p className="dash-card-meta">
                        {city.unlockedBuildingCount}/{city.buildings.length} districts débloqués
                      </p>
                    </article>
                  </div>
                </section>
              )}

              <div className="dash-overview-body dash-overview-body--clear">
                <DashCityPreview
                  city={city}
                  newBuildingIds={newBuildings}
                  onOpen={() => goTo('ville')}
                />

                <section className="dash-overview-block dash-overview-block--more">
                  <header className="dash-overview-block-head dash-overview-block-head--compact">
                    <h3>{copy.overview.quickAccessTitle}</h3>
                    <p>{copy.overview.quickAccessSubtitle}</p>
                  </header>

                  <div className="dash-overview-grid dash-overview-grid--compact">
                    <article
                      className="dash-card dash-card--tile"
                      onClick={() => goTo('profil')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && goTo('profil')}
                    >
                      <div className="dash-card-top">
                        <span className="dash-card-icon" aria-hidden="true">
                          {activeBiz?.icon ?? '◎'}
                        </span>
                        <span className="dash-card-chevron" aria-hidden="true">
                          →
                        </span>
                      </div>
                      <span className="dash-card-label">{copy.sections.profil.label}</span>
                      {profile && activeBiz ? (
                        <>
                          <p className="dash-card-value">{activeBiz.name}</p>
                          <p className="dash-card-meta">{profile.personalityLabel}</p>
                        </>
                      ) : (
                        <>
                          <p className="dash-card-value">Compléter le quiz</p>
                          <p className="dash-card-meta">Personnalise ton parcours</p>
                        </>
                      )}
                    </article>

                    {isSubscribed ? (
                      <article
                        className="dash-card dash-card--tile"
                        onClick={() => goTo('activite')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && goTo('activite')}
                      >
                        <div className="dash-card-top">
                          <span className="dash-card-icon" aria-hidden="true">
                            ◉
                          </span>
                          <span className="dash-card-chevron" aria-hidden="true">
                            →
                          </span>
                        </div>
                        <span className="dash-card-label">{copy.sections.activite.label}</span>
                        <p className="dash-card-value">{stats.coachMessages} messages</p>
                        <p className="dash-card-meta">
                          {roadmapProgress > 0 ? `Parcours ${roadmapProgress}%. ` : ''}
                          Série {city.streakDays} jour{city.streakDays > 1 ? 's' : ''}
                        </p>
                      </article>
                    ) : (
                      <article
                        className="dash-card dash-card--tile dash-card--locked"
                        onClick={() => goTo('activite')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && goTo('activite')}
                      >
                        <span className="dash-card-lock" aria-hidden="true">
                          🔒
                        </span>
                        <div className="dash-card-top">
                          <span className="dash-card-icon" aria-hidden="true">
                            ◉
                          </span>
                          <span className="dash-card-chevron" aria-hidden="true">
                            →
                          </span>
                        </div>
                        <span className="dash-card-label">{copy.sections.activite.label}</span>
                        <p className="dash-card-value">Suivi premium</p>
                        <p className="dash-card-meta">Parcours, coach, ville et bloc-notes</p>
                      </article>
                    )}

                    <article
                      className="dash-card dash-card--tile"
                      onClick={() => goTo('blocnotes')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && goTo('blocnotes')}
                    >
                      <div className="dash-card-top">
                        <span className="dash-card-icon" aria-hidden="true">
                          ✎
                        </span>
                        <span className="dash-card-chevron" aria-hidden="true">
                          →
                        </span>
                      </div>
                      <span className="dash-card-label">{copy.sections.blocnotes.label}</span>
                      <p className="dash-card-value">Mes notes</p>
                      <p className="dash-card-meta">{notepadSnippet || 'Idées, contacts et décisions'}</p>
                    </article>

                    {isGrowth ? (
                      <>
                        <article
                          className="dash-card dash-card--tile"
                          onClick={() => goTo('analyse')}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && goTo('analyse')}
                        >
                          <div className="dash-card-top">
                            <span className="dash-card-icon dash-card-icon--violet" aria-hidden="true">
                              ◐
                            </span>
                            <span className="dash-card-chevron" aria-hidden="true">
                              →
                            </span>
                          </div>
                          <span className="dash-card-label">{copy.sections.analyse.label}</span>
                          <p className="dash-card-value">Bilan IA</p>
                          <p className="dash-card-meta">Analyse approfondie. Une fois par semaine</p>
                        </article>
                        <article
                          className="dash-card dash-card--tile"
                          onClick={() => goTo('ressources')}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && goTo('ressources')}
                        >
                          <div className="dash-card-top">
                            <span className="dash-card-icon dash-card-icon--violet" aria-hidden="true">
                              ▧
                            </span>
                            <span className="dash-card-chevron" aria-hidden="true">
                              →
                            </span>
                          </div>
                          <span className="dash-card-label">{copy.sections.ressources.label}</span>
                          <p className="dash-card-value">Bibliothèque</p>
                          <p className="dash-card-meta">Templates, scripts & prompts IA</p>
                        </article>
                      </>
                    ) : (
                      <>
                        <article
                          className="dash-card dash-card--tile dash-card--locked"
                          onClick={goToAcceleratorUpgrade}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && goToAcceleratorUpgrade()}
                          aria-label="Analyse hebdo. Réservée Business Accelerator, voir les abonnements"
                        >
                          <span className="dash-card-lock" aria-hidden="true">
                            🔒
                          </span>
                          <div className="dash-card-top">
                            <span className="dash-card-icon dash-card-icon--violet" aria-hidden="true">
                              ◐
                            </span>
                            <span className="dash-card-chevron" aria-hidden="true">
                              →
                            </span>
                          </div>
                          <span className="dash-card-label">{copy.sections.analyse.label}</span>
                          <p className="dash-card-value">Business Accelerator</p>
                          <p className="dash-card-meta">
                            {isSubscribed
                              ? 'Inclus dans la formule 79 €/mois. Clique pour upgrader'
                              : 'Bilan stratégique chaque semaine. Formule 79 €/mois'}
                          </p>
                        </article>
                        <article
                          className="dash-card dash-card--tile dash-card--locked"
                          onClick={goToAcceleratorUpgrade}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && goToAcceleratorUpgrade()}
                          aria-label="Ressources. Réservées Business Accelerator, voir les abonnements"
                        >
                          <span className="dash-card-lock" aria-hidden="true">
                            🔒
                          </span>
                          <div className="dash-card-top">
                            <span className="dash-card-icon dash-card-icon--violet" aria-hidden="true">
                              ▧
                            </span>
                            <span className="dash-card-chevron" aria-hidden="true">
                              →
                            </span>
                          </div>
                          <span className="dash-card-label">{copy.sections.ressources.label}</span>
                          <p className="dash-card-value">Bibliothèque</p>
                          <p className="dash-card-meta">
                            {isSubscribed
                              ? 'Templates & prompts. Formule 79 €/mois'
                              : 'Templates, scripts & prompts. Formule 79 €/mois'}
                          </p>
                        </article>
                      </>
                    )}

                    <article
                      className={`dash-card dash-card--tile${!isSubscribed ? ' dash-card--cta' : ''}`}
                      onClick={() => goTo('abonnement')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && goTo('abonnement')}
                    >
                      <div className="dash-card-top">
                        <span className="dash-card-icon" aria-hidden="true">
                          ★
                        </span>
                        <span className="dash-card-chevron" aria-hidden="true">
                          →
                        </span>
                      </div>
                      <span className="dash-card-label">{copy.sections.abonnement.label}</span>
                      <p className="dash-card-value">{isSubscribed ? planName : 'Gratuit'}</p>
                      <p className="dash-card-meta">
                        {isSubscribed
                          ? `${planName}. Gérer la formule`
                          : 'Voir les formules premium'}
                      </p>
                    </article>
                  </div>
                </section>
              </div>
            </div>
          )}

          {section === 'parcours' &&
            (isSubscribed ? (
              <PremiumRoadmap
                businessId={activeId}
                isSubscribed={isSubscribed}
                onProgressChange={setRoadmapProgress}
              />
            ) : profile || activeId ? (
              <FreeRoadmapTeaser
                profile={profile ?? loadQuizProfile()}
                variant="dashboard"
              />
            ) : (
              <section className="premium-roadmap premium-roadmap--empty">
                <div className="premium-roadmap-header">
                  <span className="section-tag">Mon plan</span>
                  <h3>Commence par ton profil</h3>
                  <p>
                    Réponds au questionnaire pour voir ton parcours personnalisé en aperçu.
                  </p>
                </div>
                <Link href="/espace?section=profil&quiz=1" className="btn btn-primary">
                  Faire le questionnaire
                </Link>
              </section>
            ))}

          {section === 'coach' && (
            <>
              <DashFounderPath
                isSubscribed={isSubscribed}
                hasProfile={Boolean(profile || activeId)}
                businessId={activeId}
                coachMessages={stats.coachMessages}
                roadmapProgress={roadmapProgress}
                onGo={goTo}
                variant="compact"
              />
              <Coach
                isSubscribed={isSubscribed}
                serverPlanId={serverPlanId}
                isGrowth={isGrowth}
                loggedIn
              />
            </>
          )}

          {section === 'profil' &&
            (wantsQuiz ? (
              <Quiz
                variant="account"
                onSkip={() => finishQuizInEspace('profil')}
                onExplore={() => finishQuizInEspace('parcours')}
                onProfileSaved={() => refresh()}
              />
            ) : (
              <AccountProfile isSubscribed={isSubscribed} />
            ))}

          {section === 'activite' && (
            <AccountAnalytics isSubscribed={isSubscribed} serverPlanId={serverPlanId} />
          )}

          {section === 'analyse' && (
            <WeeklyDeepAnalysis
              isSubscribed={isSubscribed}
              serverPlanId={serverPlanId}
              isGrowth={isGrowth}
            />
          )}

          {section === 'ressources' && (
            <ResourceLibrary
              isSubscribed={isSubscribed}
              serverPlanId={serverPlanId}
              isGrowth={isGrowth}
            />
          )}

          {section === 'ville' && <CityView isSubscribed={isSubscribed} />}

          {section === 'blocnotes' && <AccountNotepad />}

          {section === 'abonnement' && (
            <AccountSubscription email={email} isSubscribed={isSubscribed} />
          )}

          {section === 'assistance' && (
            <AssistanceSection
              userEmail={email}
              isSubscribed={isSubscribed}
              variant="dashboard"
            />
          )}
        </div>
      </div>
    </div>
  );
}
