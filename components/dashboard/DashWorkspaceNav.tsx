'use client';

import { getSectionNavHref } from '@/lib/account/feature-access';
import { loadSubscriptionMeta } from '@/lib/account/subscription-storage';
import {
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_PRIMARY_SECTIONS,
  DASHBOARD_SECTIONS,
  type DashboardSection,
} from '@/lib/dashboard/sections';
import type { PlanId } from '@/lib/stripe';
import { useEntrepreneurCopy } from '@/components/EntrepreneurCopyProvider';

const SECTION_ICONS: Partial<Record<DashboardSection, string>> = {
  overview: '⌂',
  coach: '◈',
  parcours: '◎',
  ville: '🏙',
  profil: '☺',
  activite: '◉',
  analyse: '◐',
  ressources: '▧',
  blocnotes: '✎',
  abonnement: '★',
  assistance: '?',
};

interface DashWorkspaceNavProps {
  activeSection: DashboardSection;
  onNavigate: (section: DashboardSection) => void;
  isSubscribed: boolean;
  serverPlanId?: PlanId | null;
  isGrowth?: boolean;
  planLabel: string;
  progressLabel?: string;
}

export function DashSidebar({
  activeSection,
  onNavigate,
  isSubscribed,
  serverPlanId = null,
  planLabel,
  progressLabel,
}: DashWorkspaceNavProps) {
  const { copy } = useEntrepreneurCopy();
  const subMeta = loadSubscriptionMeta();

  return (
    <aside className="dash-sidebar" aria-label="Navigation de l'espace client">
      <div className="dash-sidebar-user">
        <span className="dash-sidebar-avatar" aria-hidden="true">
          {planLabel.charAt(0).toUpperCase()}
        </span>
        <div className="dash-sidebar-user-info">
          <strong>Mon espace</strong>
          <span className={`dash-sidebar-plan${isSubscribed ? '' : ' dash-sidebar-plan--free'}`}>
            {planLabel}
          </span>
        </div>
      </div>

      <nav className="dash-nav" aria-label="Sections">
        {DASHBOARD_NAV_GROUPS.map((group) => (
          <div key={group.id} className="dash-nav-group">
            <p className="dash-nav-group-label">{group.label}</p>
            {group.sections.map((sectionId) => {
              const section = DASHBOARD_SECTIONS.find((s) => s.id === sectionId)!;
              const nav = getSectionNavHref(
                section.id,
                section.href,
                isSubscribed,
                serverPlanId,
                subMeta
              );
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  className={`dash-nav-item${isActive ? ' is-active' : ''}${nav.locked ? ' is-locked' : ''}`}
                  onClick={() => {
                    if (nav.locked) {
                      window.location.href = nav.href;
                      return;
                    }
                    onNavigate(section.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="dash-nav-icon" aria-hidden="true">
                    {SECTION_ICONS[section.id] ?? '•'}
                  </span>
                  <span className="dash-nav-label">{copy.sections[section.id].label}</span>
                  {nav.locked && (
                    <span className="dash-nav-lock" aria-hidden="true">
                      🔒
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {progressLabel && (
        <div className="dash-sidebar-stats">
          <div className="dash-sidebar-stat">
            <span>Progression</span>
            <strong>{progressLabel}</strong>
          </div>
        </div>
      )}
    </aside>
  );
}

export function DashMobileNav({
  activeSection,
  onNavigate,
  isSubscribed,
  serverPlanId = null,
}: DashWorkspaceNavProps) {
  const { copy } = useEntrepreneurCopy();
  const subMeta = loadSubscriptionMeta();

  return (
    <nav className="dash-nav-mobile" aria-label="Navigation rapide">
      {DASHBOARD_PRIMARY_SECTIONS.map((sectionId) => {
        const section = DASHBOARD_SECTIONS.find((s) => s.id === sectionId)!;
        const nav = getSectionNavHref(section.id, section.href, isSubscribed, serverPlanId, subMeta);
        const isActive = activeSection === section.id;

        return (
          <button
            key={section.id}
            type="button"
            className={`dash-nav-mobile-item${isActive ? ' is-active' : ''}${nav.locked ? ' is-locked' : ''}`}
            onClick={() => {
              if (nav.locked) {
                window.location.href = nav.href;
                return;
              }
              onNavigate(section.id);
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            {copy.sections[section.id].label}
            {nav.locked ? ' 🔒' : ''}
          </button>
        );
      })}
    </nav>
  );
}
