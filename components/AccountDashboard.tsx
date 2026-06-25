'use client';

import AccountAnalytics from '@/components/AccountAnalytics';
import AssistanceSection from '@/components/AssistanceSection';
import AccountNotepad from '@/components/AccountNotepad';
import AccountProfile from '@/components/AccountProfile';
import CityView from '@/components/CityView';
import DashOverview from '@/components/dashboard/DashOverview';
import DashFounderPath from '@/components/dashboard/DashFounderPath';
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
  getEffectiveUnlockedRoadmapMonths,
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
      ? getTotalUnlockedRoadmapDays(getEffectiveUnlockedRoadmapMonths(true))
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
            <DashOverview
              firstName={firstName}
              isSubscribed={isSubscribed}
              isGrowth={isGrowth}
              profile={profile}
              activeId={activeId}
              activeBiz={activeBiz}
              roadmapProgress={roadmapProgress}
              coachMessages={stats.coachMessages}
              planName={planName}
              city={city}
              notepadSnippet={notepadSnippet}
              onGo={goTo}
              onUpgradeGrowth={goToAcceleratorUpgrade}
            />
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
