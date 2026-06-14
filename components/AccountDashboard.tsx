'use client';

import AccountAnalytics from '@/components/AccountAnalytics';
import AssistanceSection from '@/components/AssistanceSection';
import AccountNotepad from '@/components/AccountNotepad';
import AccountProfile from '@/components/AccountProfile';
import CityView from '@/components/CityView';
import DashCityPreview from '@/components/dashboard/DashCityPreview';
import { useEntrepreneurCopy } from '@/components/EntrepreneurCopyProvider';
import AccountSubscription from '@/components/AccountSubscription';
import Coach from '@/components/Coach';
import { loadAccountAnalytics } from '@/lib/account/analytics-storage';
import { loadLocalNotepad, notepadPreview } from '@/lib/account/notepad-storage';
import { getPlanById } from '@/lib/stripe/plans';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import { loadChosenBusiness, loadQuizProfile } from '@/lib/quiz/profile-storage';
import { hydrateQuizProfileFromServer } from '@/lib/quiz/profile-sync';
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
import { useEffect, useState } from 'react';
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
  const [profile, setProfile] = useState(loadQuizProfile());
  const [chosenId, setChosenId] = useState(loadChosenBusiness());
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
    const biz = loadChosenBusiness() ?? loadQuizProfile()?.topBusinessId ?? null;
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

  useEffect(() => {
    void hydrateQuizProfileFromServer().then((saved) => {
      if (saved) {
        setProfile(saved);
        setChosenId(loadChosenBusiness());
      }
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

  function goTo(next: DashboardSection) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'overview') params.delete('section');
    else params.set('section', next);
    params.delete('upgrade');
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
  const activeId = profile ? ((chosenId ?? profile.topBusinessId) as BusinessId) : null;
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

  return (
    <div className="dash-shell dash-shell--live">
      <div className="dash-ambient" aria-hidden="true">
        <span className="dash-orb dash-orb--1" />
        <span className="dash-orb dash-orb--2" />
        <span className="dash-orb dash-orb--3" />
      </div>
      <div className="dash-body">
        {newBuildingDetails.length > 0 && section !== 'ville' && (
          <div className="dash-toast" role="status">
            <span>
              Nouveau bâtiment : {newBuildingDetails.map((b) => `${b.icon} ${b.name}`).join(', ')}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={dismissNewBuildings}>
              OK
            </button>
          </div>
        )}

        {section !== 'coach' && section !== 'overview' && (
          <header className="dash-page-header dash-page-header--live">
            <h1>{currentSectionCopy.label}</h1>
            <p>{currentSectionCopy.description}</p>
          </header>
        )}

        <div
          key={section}
          className={`dash-content dash-content--live${section === 'coach' ? ' dash-content--flush' : ''}`}
        >
          {section === 'overview' && (
            <div className="dash-overview dash-overview--modern">
              <section className="dash-hero dash-hero--hub">
                <div className="dash-hero-glow" aria-hidden="true" />
                <div className="dash-hero-inner">
                  <div className="dash-hero-main">
                    <p className="dash-hero-kicker">
                      <span className="dash-live-dot" aria-hidden="true" />
                      Vue d&apos;ensemble
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
                            'Votre espace fondateur'
                          )}
                        </h2>
                        <p>
                          {activeBiz
                            ? copy.overview.subscribedSubtitle
                            : copy.overview.freeSubtitle}
                        </p>
                        <div className="dash-hero-stats">
                          <span className="dash-hero-stat">
                            <strong>{roadmapProgress}%</strong>
                            <span>{copy.overview.statRoadmap}</span>
                          </span>
                          <span className="dash-hero-stat">
                            <strong>{coachProgress}%</strong>
                            <span>{copy.overview.statCoach}</span>
                          </span>
                          <span className="dash-hero-stat">
                            <strong>{city.streakDays} j</strong>
                            <span>{copy.overview.statStreak}</span>
                          </span>
                          <span className="dash-hero-stat">
                            <strong>{planName}</strong>
                            <span>{copy.overview.statPlan}</span>
                          </span>
                        </div>
                        <div className="dash-hero-progress">
                          <div className="account-progress-bar">
                            <div
                              className="account-progress-fill"
                              style={{ width: `${planProgress}%` }}
                            />
                          </div>
                          <span className="dash-progress-pulse">{planProgress}%</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2>Plan gratuit. Votre profil est prêt</h2>
                        <p>
                          Quiz, analyse de profil et modèles business adaptés sont débloqués.
                          Passez à l&apos;abonnement pour le parcours 180 jours et le coach IA.
                        </p>
                        <div className="dash-hero-stats">
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

              <div className="dash-overview-body">
                <DashCityPreview
                  city={city}
                  newBuildingIds={newBuildings}
                  onOpen={() => goTo('ville')}
                />

                <div className="dash-overview-aside">
                  <header className="dash-overview-section-head">
                    <h3>{copy.overview.quickAccessTitle}</h3>
                    <p>{copy.overview.quickAccessSubtitle}</p>
                  </header>

                  <div className="dash-overview-grid">
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
                          <p className="dash-card-meta">Personnalisez votre parcours</p>
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
                              ? 'Inclus dans la formule 99 €/mois. Cliquez pour upgrader'
                              : 'Bilan stratégique chaque semaine. Formule 99 €/mois'}
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
                              ? 'Templates & prompts. Formule 99 €/mois'
                              : 'Templates, scripts & prompts. Formule 99 €/mois'}
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
                </div>
              </div>

              <div className="dash-overview-roadmap">
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
              </div>
            </div>
          )}

          {section === 'parcours' && (
            <PremiumRoadmap
              businessId={activeId}
              isSubscribed={isSubscribed}
              onProgressChange={setRoadmapProgress}
            />
          )}

          {section === 'coach' && (
            <Coach
              isSubscribed={isSubscribed}
              serverPlanId={serverPlanId}
              isGrowth={isGrowth}
              loggedIn
            />
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
