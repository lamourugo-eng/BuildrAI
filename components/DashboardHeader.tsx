'use client';

import { loadAccountAnalytics } from '@/lib/account/analytics-storage';
import { getSectionNavHref, hasGrowthAccess } from '@/lib/account/feature-access';
import { getRoadmapCompletionPercent, loadRoadmapProgress } from '@/lib/account/roadmap-storage';
import { getTotalUnlockedRoadmapDays } from '@/lib/quiz/roadmap-program';
import {
  getUnlockedRoadmapMonths,
  loadSubscriptionMeta,
} from '@/lib/account/subscription-storage';
import {
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_SECTIONS,
  resolveDashboardSection,
} from '@/lib/dashboard/sections';
import { loadChosenBusiness, loadQuizProfile } from '@/lib/quiz/profile-storage';
import { CITY_REFRESH_EVENT } from '@/lib/city/events';
import { computeCitySnapshot } from '@/lib/city/engine';
import { getPlanById } from '@/lib/stripe/plans';
import type { PlanId } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import SideNav, { type SideNavGroup, type SideNavItem, type SideNavStat } from './SideNav';
import SiteBrand from './SiteBrand';
import { useEntrepreneurCopy } from './EntrepreneurCopyProvider';

interface DashboardHeaderProps {
  email: string | null;
  accountMode?: boolean;
  isAdmin?: boolean;
  isSubscribed?: boolean;
  serverPlanId?: PlanId | null;
  isGrowth?: boolean;
}

export default function DashboardHeader({
  email,
  accountMode = false,
  isAdmin = false,
  isSubscribed = false,
  serverPlanId = null,
  isGrowth: isGrowthFromServer = false,
}: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navStats, setNavStats] = useState<SideNavStat[]>([]);
  const [planLabel, setPlanLabel] = useState<string | null>(null);
  const { copy } = useEntrepreneurCopy();
  const initial = email ? email[0].toUpperCase() : '?';

  const activeSection = useMemo(() => {
    if (pathname !== '/espace') return null;
    return resolveDashboardSection(searchParams.get('section'));
  }, [pathname, searchParams]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!accountMode) return;

    function refreshNavMeta() {
      const analytics = loadAccountAnalytics();
      const subMeta = loadSubscriptionMeta();
      const unlockedDays = isSubscribed
        ? getTotalUnlockedRoadmapDays(getUnlockedRoadmapMonths(subMeta))
        : 30;
      const city = computeCitySnapshot(analytics, isSubscribed, unlockedDays);
      const isGrowth =
        isGrowthFromServer || hasGrowthAccess(isSubscribed, serverPlanId, subMeta);
      const effectivePlanId = serverPlanId ?? subMeta.planId;
      const planName = isSubscribed
        ? (getPlanById(effectivePlanId)?.name ?? 'Premium')
        : 'Gratuit';

      setPlanLabel(planName);

      const coachProgress = Math.min(100, analytics.coachMessages * 12);
      const biz = loadChosenBusiness() ?? loadQuizProfile()?.topBusinessId ?? null;
      const storedRoadmap = loadRoadmapProgress();
      let roadmapProgress = 0;
      if (biz && storedRoadmap?.businessId === biz) {
        roadmapProgress = getRoadmapCompletionPercent(
          storedRoadmap.completedDays,
          unlockedDays
        );
      }
      const planProgress =
        isSubscribed && roadmapProgress > 0 ? roadmapProgress : coachProgress;

      setNavStats([
        {
          label: 'Niveau ville',
          value: isSubscribed ? city.level.name : '—',
          hint: isSubscribed ? `Niv. ${city.level.id}` : undefined,
          accent: isSubscribed ? city.level.accent : undefined,
        },
        {
          label: 'Progression',
          value: isSubscribed ? `${planProgress}%` : '—',
          progress: isSubscribed ? planProgress : undefined,
        },
      ]);

      return isGrowth;
    }

    refreshNavMeta();
    const onRefresh = () => refreshNavMeta();
    window.addEventListener(CITY_REFRESH_EVENT, onRefresh);
    const interval = setInterval(refreshNavMeta, 4000);
    return () => {
      window.removeEventListener(CITY_REFRESH_EVENT, onRefresh);
      clearInterval(interval);
    };
  }, [accountMode, isSubscribed, serverPlanId, isGrowthFromServer]);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setDrawerOpen(false);
    router.refresh();
  }, [router]);

  const navGroups: SideNavGroup[] = accountMode
    ? [
        ...DASHBOARD_NAV_GROUPS.map((group) => ({
          id: group.id,
          label: group.label,
          items: group.sections.map((sectionId) => {
            const section = DASHBOARD_SECTIONS.find((s) => s.id === sectionId)!;
            const subMeta = loadSubscriptionMeta();
            const nav = getSectionNavHref(
              section.id,
              section.href,
              isSubscribed,
              serverPlanId,
              subMeta
            );

            return {
              id: section.id,
              label: copy.sections[section.id].label,
              description: copy.sections[section.id].description,
              icon: section.icon,
              href: nav.href,
              active: activeSection === section.id,
              locked: nav.locked,
              badge: nav.growthBadge ? `${getPlanById('growth')?.monthly ?? 79}€` : undefined,
            } satisfies SideNavItem;
          }),
        })),
        {
          id: 'site',
          label: 'Site',
          items: [
            { id: 'home', label: 'Accueil', icon: 'home', href: '/?landing=1' },
          ],
        },
      ]
    : [];

  const footerItems: SideNavItem[] = accountMode
    ? [
        ...(isAdmin
          ? [
              {
                id: 'admin',
                label: 'Panneau admin',
                icon: 'grid',
                href: '/admin',
              } satisfies SideNavItem,
            ]
          : []),
        {
          id: 'logout',
          label: 'Déconnexion',
          icon: 'logout',
          onClick: handleLogout,
          danger: true,
        },
      ]
    : [];

  return (
    <>
      <header
        className={[
          'site-topbar',
          'site-topbar--dashboard',
          scrolled ? 'scrolled' : '',
          drawerOpen ? 'menu-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="container site-topbar-shell">
          <div className="site-topbar-bar">
            <div className="site-topbar-slot site-topbar-slot--start">
              {accountMode ? (
                <button
                  type="button"
                  className={`side-nav-trigger${drawerOpen ? ' is-open' : ''}`}
                  aria-expanded={drawerOpen}
                  aria-controls="site-side-nav"
                  aria-label={drawerOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                  onClick={() => setDrawerOpen((open) => !open)}
                >
                  <span className="side-nav-trigger-icon" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="side-nav-trigger-label">Menu</span>
                </button>
              ) : (
                <span className="site-topbar-slot-spacer" aria-hidden="true" />
              )}
            </div>

            <div className="site-topbar-slot site-topbar-slot--center">
              <SiteBrand href={accountMode ? '/espace' : '/'} />
            </div>

            <div className="site-topbar-slot site-topbar-slot--end">
              {email ? (
                <>
                  {accountMode && activeSection && activeSection !== 'overview' && (
                    <span className="site-topbar-section-pill site-topbar-section-pill--desktop">
                      {DASHBOARD_SECTIONS.find((s) => s.id === activeSection)?.label}
                    </span>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="site-topbar-cta site-topbar-cta--ghost site-topbar-cta--desktop admin-header-btn"
                    >
                      Admin
                    </Link>
                  )}
                  <Link href="/espace" className="site-topbar-user" title={email} aria-label={email}>
                    <span className="site-topbar-user-avatar" aria-hidden="true">
                      {initial}
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="site-topbar-logout"
                    onClick={handleLogout}
                    aria-label="Déconnexion"
                    title="Déconnexion"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                </>
              ) : (
                <Link href="/#pricing" className="site-topbar-cta site-topbar-cta--primary">
                  S&apos;abonner
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {accountMode && (
        <SideNav
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          groups={navGroups}
          footerItems={footerItems}
          userEmail={email}
          userPlan={planLabel}
          stats={navStats}
          showFreeCta={!isSubscribed}
        />
      )}
    </>
  );
}
