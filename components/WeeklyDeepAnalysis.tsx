'use client';

import {
  canGenerateWeeklyAnalysis,
  formatWeekPeriodLabel,
  getCurrentWeekAnalysis,
  getNextWeeklyAnalysisDate,
  getWeekKey,
  loadWeeklyAnalyses,
  saveWeeklyAnalysis,
  type WeeklyAnalysisReport,
  type WeeklyAnalysisScores,
  type WeeklyAnalysisSyncSnapshot,
} from '@/lib/account/weekly-analysis-storage';
import {
  getLast7DaysActivity,
  loadAccountAnalytics,
} from '@/lib/account/analytics-storage';
import { resolveWeeklyCoachSnapshot, type WeeklyCoachSnapshot } from '@/lib/weekly-analysis/coach-sync';
import {
  buildWeeklyRoadmapSnapshot,
  type WeeklyRoadmapSnapshot,
} from '@/lib/weekly-analysis/roadmap-sync';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import {
  buildActiveCoachProfile,
  loadChosenBusiness,
  loadQuizProfile,
} from '@/lib/quiz/profile-storage';
import { hasGrowthAccess } from '@/lib/account/feature-access';
import type { PlanId } from '@/lib/stripe';
import { useEntrepreneurCopy } from '@/components/EntrepreneurCopyProvider';
import { TOTAL_ROADMAP_DAYS } from '@/lib/quiz/roadmap-program';
import Link from 'next/link';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';

interface WeeklyDeepAnalysisProps {
  isSubscribed: boolean;
  serverPlanId?: PlanId | null;
  isGrowth?: boolean;
}

const SCORE_META = [
  { key: 'momentum' as const, label: 'Momentum', icon: '⚡', hint: 'Élan entrepreneurial' },
  { key: 'consistency' as const, label: 'Régularité', icon: '📅', hint: 'Rythme hebdomadaire' },
  { key: 'roadmapAlignment' as const, label: 'Parcours', icon: '🗺️', hint: 'Alignement parcours' },
];

const SECTION_ICONS = ['📊', '✨', '🎯', '🧭', '🔮'];

function averageScore(scores: WeeklyAnalysisScores): number {
  return Math.round(
    (scores.momentum + scores.consistency + scores.roadmapAlignment) / 3
  );
}

function scoreTone(value: number): string {
  if (value >= 70) return 'high';
  if (value >= 40) return 'mid';
  return 'low';
}

function ProgressRing({
  value,
  size = 'lg',
  label,
}: {
  value: number;
  size?: 'lg' | 'sm';
  label?: string;
}) {
  return (
    <div
      className={`weekly-ring weekly-ring--${size} weekly-ring--${scoreTone(value)}`}
      style={{ '--pct': value } as CSSProperties}
      aria-label={label ?? `${value} sur 100`}
    >
      <span>{value}</span>
    </div>
  );
}

function ScoreCard({
  icon,
  label,
  hint,
  value,
}: {
  icon: string;
  label: string;
  hint: string;
  value: number;
}) {
  return (
    <article className={`weekly-metric weekly-metric--${scoreTone(value)}`}>
      <div className="weekly-metric-top">
        <span className="weekly-metric-icon" aria-hidden="true">
          {icon}
        </span>
        <ProgressRing value={value} size="sm" label={label} />
      </div>
      <div className="weekly-metric-copy">
        <strong>{label}</strong>
        <span>{hint}</span>
      </div>
      <div className="weekly-metric-bar">
        <div className="weekly-metric-bar-fill" style={{ width: `${value}%` }} />
      </div>
    </article>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <article className="weekly-feature-card">
      <span className="weekly-feature-icon" aria-hidden="true">
        {icon}
      </span>
      <strong>{title}</strong>
      <p>{desc}</p>
    </article>
  );
}

function SyncMetric({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  href?: string;
}) {
  const body = (
    <article className="weekly-sync-metric">
      <span className="weekly-sync-metric-label">{label}</span>
      <strong>{value}</strong>
      <p>{hint}</p>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="weekly-sync-metric-link">
        {body}
      </Link>
    );
  }

  return body;
}

function WeeklySyncPanel({
  roadmap,
  coach,
  loading,
  snapshot,
}: {
  roadmap: WeeklyRoadmapSnapshot | null;
  coach: WeeklyCoachSnapshot | null;
  loading: boolean;
  snapshot?: WeeklyAnalysisSyncSnapshot | null;
}) {
  const data = snapshot
    ? {
        roadmapDay: snapshot.roadmapDay,
        roadmapDayTitle: snapshot.roadmapDayTitle,
        chapter: snapshot.chapter,
        chapterLabel: snapshot.chapterLabel,
        completedDays: snapshot.completedDays,
        unlockedDays: snapshot.unlockedDays,
        percentUnlocked: snapshot.percentUnlocked,
        coachingPhase: snapshot.coachingPhase,
        coachingStepLabel: snapshot.coachingStepLabel,
        expectedCoachPhase: snapshot.expectedCoachPhase,
        coachMemorySource: snapshot.coachMemorySource,
      }
    : roadmap
      ? {
          roadmapDay: roadmap.currentGlobalDay,
          roadmapDayTitle: roadmap.currentDayTitle,
          chapter: roadmap.currentChapter,
          chapterLabel: roadmap.currentChapterLabel,
          completedDays: roadmap.completedCount,
          unlockedDays: roadmap.totalUnlockedDays,
          percentUnlocked: roadmap.percentUnlocked,
          coachingPhase: coach?.coachingPhase ?? null,
          coachingStepLabel: coach?.coachingStepLabel ?? null,
          expectedCoachPhase: roadmap.expectedCoachPhase,
          coachMemorySource: coach?.source ?? ('none' as const),
        }
      : null;

  if (!data && !loading) return null;

  const phaseGap =
    data?.coachingPhase != null
      ? Math.abs(data.coachingPhase - data.expectedCoachPhase)
      : null;
  const aligned = phaseGap != null && phaseGap <= 1;

  return (
    <section className="weekly-sync-panel" aria-label="Synchronisation parcours et coach">
      <div className="weekly-sync-head">
        <div>
          <span className="weekly-sync-kicker">Données synchronisées</span>
          <h3>Avancement parcours & coach</h3>
          <p>
            {snapshot
              ? 'Instantané enregistré lors de la génération de cette analyse.'
              : 'État actuel utilisé pour la prochaine analyse hebdomadaire.'}
          </p>
        </div>
        {data && (
          <span
            className={`weekly-sync-badge${aligned ? ' weekly-sync-badge--ok' : ' weekly-sync-badge--warn'}`}
          >
            {aligned ? '● Aligné' : '○ Écart coach / parcours'}
          </span>
        )}
      </div>

      {loading && !data ? (
        <p className="weekly-sync-loading">Synchronisation des données…</p>
      ) : data ? (
        <div className="weekly-sync-metrics">
          <SyncMetric
            label="Parcours"
            value={`J${data.roadmapDay}/${TOTAL_ROADMAP_DAYS}`}
            hint={`${data.roadmapDayTitle}. ${data.completedDays}/${data.unlockedDays} jours cochés (${data.percentUnlocked} %)`}
            href="/espace?section=parcours"
          />
          <SyncMetric
            label="Chapitre"
            value={`M${data.chapter}`}
            hint={data.chapterLabel}
          />
          <SyncMetric
            label="Coach"
            value={
              data.coachingPhase != null
                ? `Étape ${data.coachingPhase}/8`
                : '—'
            }
            hint={
              data.coachingStepLabel
                ? `${data.coachingStepLabel}. Mémoire ${data.coachMemorySource === 'cloud' ? 'cloud' : data.coachMemorySource === 'local' ? 'locale' : 'vide'}`
                : 'Aucune session coach mémorisée'
            }
            href="/espace?section=coach"
          />
        </div>
      ) : null}
    </section>
  );
}

export default function WeeklyDeepAnalysis({
  isSubscribed,
  serverPlanId = null,
  isGrowth: isGrowthFromServer = false,
}: WeeklyDeepAnalysisProps) {
  const { copy } = useEntrepreneurCopy();
  const [isGrowth, setIsGrowth] = useState(isGrowthFromServer);
  const [current, setCurrent] = useState<WeeklyAnalysisReport | null>(null);
  const [history, setHistory] = useState<WeeklyAnalysisReport[]>([]);
  const [canGenerate, setCanGenerate] = useState(false);
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeBizName, setActiveBizName] = useState<string | null>(null);
  const [activeBizIcon, setActiveBizIcon] = useState<string | null>(null);
  const [roadmapSync, setRoadmapSync] = useState<WeeklyRoadmapSnapshot | null>(null);
  const [coachSync, setCoachSync] = useState<WeeklyCoachSnapshot | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const weekLabel = formatWeekPeriodLabel(getWeekKey());

  async function loadSyncData(businessId: BusinessId) {
    setSyncLoading(true);
    try {
      setRoadmapSync(buildWeeklyRoadmapSnapshot(businessId, isSubscribed));
      const coach = await resolveWeeklyCoachSnapshot(businessId);
      setCoachSync(coach);
    } finally {
      setSyncLoading(false);
    }
  }

  function refresh() {
    const growth = isGrowthFromServer || hasGrowthAccess(isSubscribed, serverPlanId);
    setIsGrowth(growth);
    const reports = loadWeeklyAnalyses();
    setCurrent(getCurrentWeekAnalysis());
    setHistory(reports.filter((item) => item.weekKey !== getWeekKey()));
    setCanGenerate(growth && canGenerateWeeklyAnalysis(reports));
    setNextDate(getNextWeeklyAnalysisDate());

    const snapshot = loadQuizProfile();
    const bizId = (loadChosenBusiness() ?? snapshot?.topBusinessId) as BusinessId | undefined;
    const biz = bizId ? businessProfiles[bizId] : null;
    setActiveBizName(biz?.name ?? null);
    setActiveBizIcon(biz?.icon ?? null);

    if (bizId && growth) {
      void loadSyncData(bizId);
    } else {
      setRoadmapSync(null);
      setCoachSync(null);
    }
  }

  useEffect(() => {
    refresh();
  }, [isSubscribed, serverPlanId, isGrowthFromServer]);

  useEffect(() => {
    function onFocus() {
      if (!isSubscribed || !hasGrowthAccess(isSubscribed, serverPlanId)) return;
      const snapshot = loadQuizProfile();
      const bizId = (loadChosenBusiness() ?? snapshot?.topBusinessId) as BusinessId | undefined;
      if (bizId) void loadSyncData(bizId);
    }

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isSubscribed]);

  const overallScore = useMemo(
    () => (current ? averageScore(current.scores) : null),
    [current]
  );

  async function handleGenerate() {
    setLoading(true);
    setError('');

    try {
      const snapshot = loadQuizProfile();
      if (!snapshot) throw new Error('Complète le questionnaire pour générer une analyse.');

      const activeId = (loadChosenBusiness() ?? snapshot.topBusinessId) as BusinessId;
      const activeProfile = buildActiveCoachProfile(snapshot, activeId);
      const analytics = loadAccountAnalytics();

      await loadSyncData(activeId);
      const roadmap = buildWeeklyRoadmapSnapshot(activeId, true);
      const coach = await resolveWeeklyCoachSnapshot(activeId);

      const res = await fetch('/api/weekly-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: activeProfile,
          businessId: activeId,
          analytics: {
            coachMessages: analytics.coachMessages,
            coachSessions: analytics.coachSessions,
            lastActiveAt: analytics.lastActiveAt,
            quizCompletedAt: analytics.quizCompletedAt,
          },
          activity7d: getLast7DaysActivity(),
          roadmap,
          coach,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de générer l\'analyse.');

      const weekKey = getWeekKey();
      const report: WeeklyAnalysisReport = {
        weekKey,
        periodLabel: formatWeekPeriodLabel(weekKey),
        generatedAt: new Date().toISOString(),
        summary: data.summary,
        sections: data.sections,
        priorities: data.priorities,
        risks: data.risks,
        scores: data.scores,
        syncSnapshot: data.syncSnapshot as WeeklyAnalysisSyncSnapshot | null | undefined,
      };

      saveWeeklyAnalysis(report);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  if (!isSubscribed) {
    return (
      <div className="weekly-hub weekly-hub--locked">
        <header className="weekly-hub-hero">
          <div className="weekly-hub-hero-glow" aria-hidden="true" />
          <div className="weekly-hub-hero-inner">
            <span className="weekly-hub-kicker">Business Accelerator</span>
            <h2>Analyse hebdomadaire approfondie</h2>
            <p>
              Un bilan stratégique généré chaque semaine à partir de ton activité coach, de ton
              parcours et de ton profil entrepreneurial.
            </p>
          </div>
        </header>
        <div className="weekly-feature-grid">
          <FeatureCard
            icon="📊"
            title="5 axes d'analyse"
            desc="Bilan, forces, axes d'amélioration, alignement et focus semaine prochaine."
          />
          <FeatureCard
            icon="⚡"
            title="Scores intelligents"
            desc="Momentum, régularité et alignement parcours en un coup d'œil."
          />
          <FeatureCard
            icon="🎯"
            title="Priorités actionnables"
            desc="3 actions concrètes pour les 7 prochains jours."
          />
        </div>
        <Link href="/subscribe?plan=growth&period=monthly" className="btn btn-primary btn-lg">
          Passer à Business Accelerator. 79 €/mois
        </Link>
      </div>
    );
  }

  if (!isGrowth) {
    return (
      <div className="weekly-hub weekly-hub--locked weekly-hub--upgrade">
        <header className="weekly-hub-hero">
          <div className="weekly-hub-hero-glow" aria-hidden="true" />
          <div className="weekly-hub-hero-inner">
            <span className="weekly-hub-kicker">{copy.weekly.lockedKicker}</span>
            <h2>{copy.weekly.lockedTitle}</h2>
            <p>{copy.weekly.lockedBody}</p>
          </div>
        </header>
        <div className="weekly-feature-grid">
          <FeatureCard
            icon="🧠"
            title="IA stratégique"
            desc="Synthèse personnalisée basée sur tes échanges coach et ta progression."
          />
          <FeatureCard
            icon="📈"
            title="Indicateurs clés"
            desc="Visualise ton momentum et ton régularité semaine après semaine."
          />
          <FeatureCard
            icon="⚠️"
            title="Alertes précoces"
            desc="Identifie les blocages avant qu'ils ne freinent ton lancement."
          />
        </div>
        <Link href="/subscribe?plan=growth&period=monthly" className="btn btn-primary btn-lg">
          Passer à Business Accelerator
        </Link>
      </div>
    );
  }

  return (
    <div className="weekly-hub">
      <header className="weekly-hub-hero">
        <div className="weekly-hub-hero-glow" aria-hidden="true" />
        <div className="weekly-hub-hero-main">
          <div className="weekly-hub-hero-copy">
            <span className="weekly-hub-kicker">Business Accelerator</span>
            <h2>
              {activeBizIcon && (
                <span className="weekly-hub-model-icon" aria-hidden="true">
                  {activeBizIcon}
                </span>
              )}
              Analyse hebdomadaire
            </h2>
            <p>
              {activeBizName
                ? `Bilan stratégique pour ${activeBizName}. Semaine du ${weekLabel}.`
                : `Bilan stratégique. Semaine du ${weekLabel}.`}
            </p>
            <div className="weekly-hub-chips">
              <span className="weekly-hub-chip">
                {canGenerate ? '● Prête à générer' : current ? '● Analyse à jour' : '○ En attente'}
              </span>
              {!canGenerate && current && nextDate && (
                <span className="weekly-hub-chip weekly-hub-chip--muted">
                  Prochaine le {nextDate}
                </span>
              )}
            </div>
          </div>

          {overallScore != null && (
            <div className="weekly-hub-score-block">
              <ProgressRing value={overallScore} label="Score global" />
              <span className="weekly-hub-score-label">Score global</span>
            </div>
          )}
        </div>
      </header>

      <WeeklySyncPanel
        roadmap={roadmapSync}
        coach={coachSync}
        loading={syncLoading}
        snapshot={current?.syncSnapshot}
      />

      {canGenerate && (
        <section className="weekly-generate-banner">
          <div className="weekly-generate-copy">
            <strong>Nouvelle analyse disponible</strong>
            <p>
              Ton activité de la semaine ({weekLabel}) est prête à être analysée par l&apos;IA.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary weekly-generate-btn"
            onClick={() => void handleGenerate()}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="weekly-generate-spinner" aria-hidden="true" />
                Analyse en cours…
              </>
            ) : (
              'Générer mon analyse'
            )}
          </button>
        </section>
      )}

      {loading && !current && (
        <section className="weekly-loading" aria-live="polite">
          <div className="weekly-loading-ring" />
          <p>Construction de ton bilan hebdomadaire…</p>
        </section>
      )}

      {error && <p className="auth-error weekly-error">{error}</p>}

      {current && (
        <div className="weekly-report">
          <section className="weekly-report-intro">
            <div className="weekly-report-intro-head">
              <span className="weekly-report-badge">Semaine en cours</span>
              <time dateTime={current.generatedAt}>
                {new Date(current.generatedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>
            <blockquote className="weekly-report-summary">{current.summary}</blockquote>
          </section>

          <section className="weekly-metrics" aria-label="Scores de la semaine">
            {SCORE_META.map((item) => (
              <ScoreCard
                key={item.key}
                icon={item.icon}
                label={item.label}
                hint={item.hint}
                value={current.scores[item.key]}
              />
            ))}
          </section>

          <section className="weekly-insights" aria-label="Analyse détaillée">
            <h3 className="weekly-section-title">Analyse détaillée</h3>
            <div className="weekly-insights-grid">
              {current.sections.map((section, index) => (
                <article
                  key={section.title}
                  className={`weekly-insight-card${index === 0 ? ' weekly-insight-card--lead' : ''}`}
                >
                  <div className="weekly-insight-head">
                    <span className="weekly-insight-icon" aria-hidden="true">
                      {SECTION_ICONS[index] ?? '📌'}
                    </span>
                    <h4>{section.title}</h4>
                  </div>
                  <p>{section.content}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="weekly-actions-row">
            <article className="weekly-priority-panel">
              <div className="weekly-panel-head">
                <span className="weekly-panel-icon" aria-hidden="true">
                  🎯
                </span>
                <div>
                  <h3>Priorités. 7 prochains jours</h3>
                  <p>Actions recommandées pour maintenir l&apos;élan.</p>
                </div>
              </div>
              <ol className="weekly-priority-list">
                {current.priorities.map((item, index) => (
                  <li key={item}>
                    <span className="weekly-priority-rank">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </article>

            {current.risks.length > 0 && (
              <article className="weekly-risk-panel">
                <div className="weekly-panel-head">
                  <span className="weekly-panel-icon" aria-hidden="true">
                    ⚠️
                  </span>
                  <div>
                    <h3>Points de vigilance</h3>
                    <p>Blocages à surveiller cette semaine.</p>
                  </div>
                </div>
                <ul className="weekly-risk-list">
                  {current.risks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            )}
          </section>
        </div>
      )}

      {!current && !canGenerate && !loading && (
        <section className="weekly-empty">
          <span className="weekly-empty-icon" aria-hidden="true">
            ◐
          </span>
          <p>Aucune analyse enregistrée pour le moment.</p>
        </section>
      )}

      {history.length > 0 && (
        <section className="weekly-history">
          <button
            type="button"
            className="weekly-history-toggle"
            onClick={() => setHistoryOpen((v) => !v)}
            aria-expanded={historyOpen}
          >
            <span>Analyses précédentes</span>
            <span className="weekly-history-count">{history.length}</span>
            <span className="weekly-history-chevron" aria-hidden="true">
              {historyOpen ? '▴' : '▾'}
            </span>
          </button>

          {historyOpen && (
            <ul className="weekly-history-list">
              {history.map((item) => (
                <li key={item.weekKey} className="weekly-history-item">
                  <div className="weekly-history-item-head">
                    <strong>Semaine du {item.periodLabel}</strong>
                    <ProgressRing
                      value={averageScore(item.scores)}
                      size="sm"
                      label="Score global"
                    />
                  </div>
                  <p>{item.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
