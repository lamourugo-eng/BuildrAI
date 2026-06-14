'use client';

import { buildActivitySummary, formatRoadmapActivityDescription } from '@/lib/account/activity-summary';
import {
  ANALYTICS_KEY,
  getLast7DaysActivity,
} from '@/lib/account/analytics-storage';
import { ROADMAP_PROGRESS_KEY } from '@/lib/account/roadmap-storage';
import { NOTEPAD_KEY } from '@/lib/account/notepad-storage';
import { SUBSCRIPTION_META_KEY } from '@/lib/account/subscription-storage';
import { CITY_REFRESH_EVENT } from '@/lib/city/events';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { PlanId } from '@/lib/stripe';

interface AccountAnalyticsProps {
  isSubscribed?: boolean;
  serverPlanId?: PlanId | null;
}

function formatLastActive(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function usageBarPercent(value: number, referenceCap: number): number {
  if (value <= 0) return 0;
  const cap = Math.max(referenceCap, value);
  return Math.min(100, Math.round((value / cap) * 100));
}

const COACH_USAGE_METERS = [
  { id: 'messages', label: 'Messages', cap: 30 },
  { id: 'sessions', label: 'Sessions', cap: 12 },
  { id: 'streak', label: 'Série', cap: 14 },
] as const;

export default function AccountAnalytics({
  isSubscribed = false,
  serverPlanId = null,
}: AccountAnalyticsProps) {
  const [summary, setSummary] = useState(() => buildActivitySummary(isSubscribed, serverPlanId));
  const [activity, setActivity] = useState(getLast7DaysActivity());

  const refresh = useCallback(() => {
    setSummary(buildActivitySummary(isSubscribed, serverPlanId));
    setActivity(getLast7DaysActivity());
  }, [isSubscribed, serverPlanId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (
        e.key === ANALYTICS_KEY ||
        e.key === ROADMAP_PROGRESS_KEY ||
        e.key === SUBSCRIPTION_META_KEY ||
        e.key === NOTEPAD_KEY
      ) {
        refresh();
      }
    }

    window.addEventListener(CITY_REFRESH_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    const interval = setInterval(refresh, 5000);

    return () => {
      window.removeEventListener(CITY_REFRESH_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, [refresh]);

  const maxDay = Math.max(...activity.map((d) => d.count), 1);
  const coachMeterValues = {
    messages: summary.coachMessages,
    sessions: summary.coachSessions,
    streak: summary.streakDays,
  };
  const coachMeterLabels = {
    messages: String(summary.coachMessages),
    sessions: String(summary.coachSessions),
    streak: `${summary.streakDays} j`,
  };

  if (!isSubscribed) {
    return (
      <div className="account-panel account-rewards-locked">
        <span className="section-tag">Activité</span>
        <h2>Suivi d&apos;activité réservé aux abonnés</h2>
        <p className="account-panel-intro">
          Visualisez ton régularité avec le coach, la progression de ton parcours sur 180 jours,
          l&apos;évolution de ton ville et tes notes. En un seul endroit.
        </p>

        <div className="account-rewards-preview">
          <article className="account-stat-card">
            <span className="account-stat-label">Compatibilité profil</span>
            <strong className="account-stat-value">
              {summary.profilePercent !== null ? `${summary.profilePercent}%` : '—'}
            </strong>
          </article>
          <article className="account-card account-card--wide account-card--muted">
            <h3>Questionnaire</h3>
            <p className="account-card-desc">
              {summary.quizCompletedAt
                ? `Complété le ${new Date(summary.quizCompletedAt).toLocaleDateString('fr-FR')}`
                : 'Non complété. Fais le quiz pour affiner ton profil.'}
              {summary.businessName ? `. Modèle : ${summary.businessName}` : ''}
            </p>
          </article>
          <ul className="account-rewards-earn-list">
            <li>Parcours premium. 180 jours (6 chapitres de 30 jours)</li>
            <li>Messages coach, sessions et série de régularité</li>
            <li>Niveau de ton ville et phase coach (8 étapes)</li>
            <li>Graphique d&apos;activité sur 7 jours + bloc-notes</li>
          </ul>
        </div>

        <Link href="/subscribe?plan=starter&period=monthly" className="btn btn-primary">
          S&apos;abonner pour suivre ta progression
        </Link>
      </div>
    );
  }

  return (
    <div className="account-panel">
      <span className="section-tag">Activité</span>
      <h2>Ton engagement</h2>
      <p className="account-panel-intro">
        Coach, parcours 180 jours, ville entrepreneuriale et bloc-notes. Toutes tes actions
        {summary.businessName ? ` sur ${summary.businessName}` : ''} en un coup d&apos;œil.
      </p>

      <div className="account-stats-grid account-stats-grid--3">
        <article className="account-stat-card">
          <span className="account-stat-label">Parcours</span>
          <strong className="account-stat-value account-stat-value--sm">
            {summary.roadmapCompleted}/{summary.roadmapUnlockedDays}
          </strong>
        </article>
        <article className="account-stat-card">
          <span className="account-stat-label">Phase coach</span>
          <strong className="account-stat-value">{summary.coachingPhase}/8</strong>
        </article>
        <article className="account-stat-card">
          <span className="account-stat-label">Niveau ville</span>
          <strong className="account-stat-value account-stat-value--sm">
            {summary.cityLevelName}
          </strong>
        </article>
      </div>

      <div className="account-card account-card--wide account-coach-stats">
        <div className="account-progress-header">
          <h3>Statistiques coach</h3>
          <span>{summary.coachMessages} messages</span>
        </div>

        <div className="account-coach-meters" role="list" aria-label="Utilisation du coach">
          {COACH_USAGE_METERS.map((meter) => {
            const value = coachMeterValues[meter.id];
            const pct = usageBarPercent(value, meter.cap);
            return (
              <div key={meter.id} className="account-coach-meter" role="listitem">
                <span className="account-coach-meter-label">{meter.label}</span>
                <div
                  className="account-coach-meter-bar"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={meter.cap}
                  aria-valuenow={value}
                  aria-label={`${meter.label} : ${coachMeterLabels[meter.id]}`}
                >
                  <div
                    className="account-coach-meter-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <strong className="account-coach-meter-value">{coachMeterLabels[meter.id]}</strong>
              </div>
            );
          })}
        </div>

        <h4 className="account-coach-chart-title">Messages. 7 derniers jours</h4>
        <div className="account-activity-chart account-activity-chart--coach">
          {activity.map((day) => (
            <div key={day.label} className="account-activity-col">
              <div className="account-activity-bar-track">
                <div
                  className="account-activity-bar"
                  style={{ height: `${(day.count / maxDay) * 100}%` }}
                  title={`${day.count} message${day.count > 1 ? 's' : ''}`}
                />
              </div>
              <span>{day.label}</span>
              <strong>{day.count}</strong>
            </div>
          ))}
        </div>
        <p className="account-card-desc">
          Dernière activité : {formatLastActive(summary.lastActiveAt)}
        </p>
        <Link href="/espace?section=coach" className="account-inline-link">
          Ouvrir le coach →
        </Link>
      </div>

      <div className="account-activity-dual">
        <div className="account-card account-card--wide">
          <div className="account-progress-header">
            <h3>Parcours premium</h3>
            <span>{summary.roadmapPercent}%</span>
          </div>
          <div className="account-progress-bar">
            <div
              className="account-progress-fill account-progress-fill--violet"
              style={{ width: `${summary.roadmapPercent}%` }}
            />
          </div>
          <p className="account-card-desc">
            {formatRoadmapActivityDescription(summary)}
          </p>
          <Link href="/espace?section=parcours" className="account-inline-link">
            Ouvrir le parcours →
          </Link>
        </div>

        <div className="account-card account-card--wide">
          <div className="account-progress-header">
            <h3>Ma ville</h3>
            <span>
              {summary.unlockedBuildings}/{summary.totalBuildings} bâtiments
            </span>
          </div>
          <div className="account-progress-bar">
            <div
              className="account-progress-fill account-progress-fill--city"
              style={{
                width: `${Math.round(
                  (summary.unlockedBuildings / Math.max(1, summary.totalBuildings)) * 100
                )}%`,
              }}
            />
          </div>
          <p className="account-card-desc">
            Niveau {summary.cityLevelId}. {summary.cityLevelName}. Ton quartier grandit avec
            ton régularité et tes étapes franchies.
          </p>
          <Link href="/espace?section=ville" className="account-inline-link">
            Voir ma ville →
          </Link>
        </div>
      </div>

      <div className="account-activity-dual">
        <div className="account-card account-card--wide account-card--muted">
          <h3>Bloc-notes</h3>
          <p className="account-card-desc">
            {summary.notepadChars > 0
              ? `${summary.notepadChars} caractères enregistrés. Idées, contacts et décisions de tes sessions coach.`
              : 'Aucune note pour le moment. Utilise le bloc-notes dans le coach ou l’onglet dédié.'}
          </p>
          <Link href="/espace?section=blocnotes" className="account-inline-link">
            Ouvrir le bloc-notes →
          </Link>
        </div>

        <div className="account-card account-card--wide account-card--muted">
          <h3>Profil & abonnement</h3>
          <p className="account-card-desc">
            {summary.quizCompletedAt
              ? `Quiz complété le ${new Date(summary.quizCompletedAt).toLocaleDateString('fr-FR')}`
              : 'Quiz non complété.'}
            {summary.profilePercent !== null ? `. Compatibilité ${summary.profilePercent}%` : ''}
            {summary.planName ? `. Formule ${summary.planName}` : ''}
            {summary.isGrowth ? '. Business Accelerator' : ''}
          </p>
          <Link href="/espace?section=abonnement" className="account-inline-link">
            Gérer mon abonnement →
          </Link>
        </div>
      </div>
    </div>
  );
}
