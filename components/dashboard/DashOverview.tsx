'use client';

import FreeRoadmapTeaser from '@/components/FreeRoadmapTeaser';
import { useEntrepreneurCopy } from '@/components/EntrepreneurCopyProvider';
import { resolveFounderJourney } from '@/lib/dashboard/founder-journey';
import type { DashboardSection } from '@/lib/dashboard/sections';
import { resolveCurrentRoadmapStep } from '@/lib/quiz/current-roadmap-step';
import type { CitySnapshot } from '@/lib/city/engine';
import type { BusinessId } from '@/lib/quiz/data';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';
import type { CSSProperties } from 'react';

interface DashOverviewProps {
  firstName: string;
  isSubscribed: boolean;
  isGrowth: boolean;
  profile: QuizProfileSnapshot | null;
  activeId: BusinessId | null;
  activeBiz: { name: string; icon: string } | null;
  roadmapProgress: number;
  coachMessages: number;
  planName: string;
  city: CitySnapshot;
  notepadSnippet: string;
  onGo: (section: DashboardSection, options?: { quiz?: boolean }) => void;
  onUpgradeGrowth: () => void;
}

interface QuickTile {
  id: string;
  section: DashboardSection;
  icon: string;
  label: string;
  hint?: string;
  locked?: boolean;
  onClick?: () => void;
}

export default function DashOverview({
  firstName,
  isSubscribed,
  isGrowth,
  profile,
  activeId,
  activeBiz,
  roadmapProgress,
  coachMessages,
  planName,
  city,
  notepadSnippet,
  onGo,
  onUpgradeGrowth,
}: DashOverviewProps) {
  const { copy } = useEntrepreneurCopy();
  const journey = resolveFounderJourney({
    isSubscribed,
    hasProfile: Boolean(profile || activeId),
    businessId: activeId,
    coachMessages,
    roadmapProgress,
  });

  const roadmapStep =
    activeId && isSubscribed ? resolveCurrentRoadmapStep(activeId, true) : null;

  const quickTiles: QuickTile[] = [
    {
      id: 'coach',
      section: 'coach',
      icon: '◈',
      label: copy.sections.coach.label,
      hint: coachMessages > 0 ? `${coachMessages} msg` : 'Poser une question',
      locked: !isSubscribed,
    },
    {
      id: 'parcours',
      section: 'parcours',
      icon: '◎',
      label: copy.sections.parcours.label,
      hint: roadmapProgress > 0 ? `${roadmapProgress}%` : 'Jour 1',
      locked: !isSubscribed,
    },
    {
      id: 'ville',
      section: 'ville',
      icon: '🏙',
      label: copy.sections.ville.label,
      hint: city.hasAvatar ? city.level.name : 'Avatar',
    },
    {
      id: 'blocnotes',
      section: 'blocnotes',
      icon: '✎',
      label: copy.sections.blocnotes.label,
      hint: notepadSnippet ? 'Notes' : 'Vide',
    },
    {
      id: 'profil',
      section: 'profil',
      icon: activeBiz?.icon ?? '◎',
      label: copy.sections.profil.label,
      hint: activeBiz?.name ?? 'Quiz',
    },
    {
      id: 'activite',
      section: 'activite',
      icon: '◉',
      label: copy.sections.activite.label,
      hint: isSubscribed ? `Série ${city.streakDays}j` : 'Premium',
      locked: !isSubscribed,
    },
  ];

  const growthTiles: QuickTile[] = isGrowth
    ? [
        {
          id: 'analyse',
          section: 'analyse',
          icon: '◐',
          label: copy.sections.analyse.label,
          hint: 'Hebdo',
        },
        {
          id: 'ressources',
          section: 'ressources',
          icon: '▧',
          label: copy.sections.ressources.label,
          hint: 'Templates',
        },
      ]
    : isSubscribed
      ? [
          {
            id: 'analyse',
            section: 'analyse',
            icon: '◐',
            label: copy.sections.analyse.label,
            hint: 'Accelerator',
            locked: true,
            onClick: onUpgradeGrowth,
          },
          {
            id: 'ressources',
            section: 'ressources',
            icon: '▧',
            label: copy.sections.ressources.label,
            hint: 'Accelerator',
            locked: true,
            onClick: onUpgradeGrowth,
          },
        ]
      : [];

  function handleTile(tile: QuickTile) {
    if (tile.onClick) {
      tile.onClick();
      return;
    }
    if (tile.locked) {
      onGo('abonnement');
      return;
    }
    onGo(tile.section);
  }

  function handlePrimaryAction() {
    onGo(journey.primarySection, journey.openQuiz ? { quiz: true } : undefined);
  }

  return (
    <div className="dash-overview dash-overview-v2">
      <header className="dash-hub-top">
        <div className="dash-hub-top-main">
          <p className="dash-hub-greeting">
            <span className="dash-live-dot" aria-hidden="true" />
            {firstName ? `Bonjour, ${firstName}` : copy.overview.kicker}
          </p>
          {activeBiz && (
            <p className="dash-hub-model">
              <span aria-hidden="true">{activeBiz.icon}</span>
              {activeBiz.name}
            </p>
          )}
        </div>
        <div className="dash-hub-stats" aria-label="Indicateurs">
          <span className="dash-hub-stat">
            <strong>{isSubscribed ? `${roadmapProgress}%` : profile ? 'OK' : '—'}</strong>
            <span>{copy.overview.statRoadmap}</span>
          </span>
          <span className="dash-hub-stat">
            <strong>{city.streakDays}j</strong>
            <span>{copy.overview.statStreak}</span>
          </span>
          <span className="dash-hub-stat dash-hub-stat--muted">
            <strong>{isSubscribed ? planName : 'Gratuit'}</strong>
            <span>{copy.overview.statPlan}</span>
          </span>
        </div>
      </header>

      <section className="dash-hub-focus" aria-labelledby="dash-hub-focus-title">
        <div className="dash-hub-focus-main">
          <span className="dash-hub-focus-kicker">
            {isSubscribed ? copy.overview.todayTitle : 'Prochaine étape'}
          </span>
          <h2 id="dash-hub-focus-title">{journey.headline}</h2>
          <p>{journey.summary}</p>
          {journey.syncNote && <p className="dash-hub-focus-sync">{journey.syncNote}</p>}

          {isSubscribed && roadmapStep && roadmapStep.status !== 'completed_all' && (
            <div className="dash-hub-day-card">
              <div
                className="dash-hub-day-ring"
                style={{ '--progress': `${roadmapProgress}%` } as CSSProperties}
                aria-hidden="true"
              >
                <span>{roadmapProgress}%</span>
              </div>
              <div className="dash-hub-day-copy">
                <strong>
                  Jour {roadmapStep.day.dayInMonth}. {roadmapStep.day.title}
                </strong>
                <span>{roadmapStep.day.objective}</span>
              </div>
            </div>
          )}

          {!isSubscribed && profile && (
            <FreeRoadmapTeaser profile={profile} variant="dashboard" showUpgradeCta={false} />
          )}
        </div>

        <div className="dash-hub-focus-actions">
          <button type="button" className="btn btn-primary" onClick={handlePrimaryAction}>
            {journey.primaryCta}
          </button>
          {isSubscribed && journey.primarySection !== 'coach' && (
            <button type="button" className="btn btn-outline" onClick={() => onGo('coach')}>
              {copy.sections.coach.label}
            </button>
          )}
        </div>
      </section>

      <nav className="dash-hub-quick" aria-label={copy.overview.quickAccessTitle}>
        <p className="dash-hub-quick-label">{copy.overview.quickAccessTitle}</p>
        <div className="dash-hub-quick-grid">
          {[...quickTiles, ...growthTiles].map((tile) => (
            <button
              key={tile.id}
              type="button"
              className={`dash-hub-tile${tile.locked ? ' dash-hub-tile--locked' : ''}`}
              onClick={() => handleTile(tile)}
            >
              {tile.locked && (
                <span className="dash-hub-tile-lock" aria-hidden="true">
                  🔒
                </span>
              )}
              <span className="dash-hub-tile-icon" aria-hidden="true">
                {tile.icon}
              </span>
              <span className="dash-hub-tile-label">{tile.label}</span>
              {tile.hint && <span className="dash-hub-tile-hint">{tile.hint}</span>}
            </button>
          ))}
        </div>
      </nav>

      <footer className="dash-hub-foot">
        <button type="button" className="dash-hub-foot-link" onClick={() => onGo('abonnement')}>
          {isSubscribed ? `${planName} · Gérer` : 'Voir les formules'}
        </button>
        <button type="button" className="dash-hub-foot-link" onClick={() => onGo('assistance')}>
          {copy.sections.assistance.label}
        </button>
      </footer>
    </div>
  );
}
