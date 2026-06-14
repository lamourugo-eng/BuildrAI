'use client';

import {
  getRoadmapCompletionPercent,
  loadRoadmapProgress,
  ROADMAP_PROGRESS_EVENT,
  ROADMAP_PROGRESS_KEY,
  toggleRoadmapDay,
  type RoadmapProgress,
} from '@/lib/account/roadmap-storage';
import {
  getUnlockedRoadmapMonths,
  loadSubscriptionMeta,
} from '@/lib/account/subscription-storage';
import { syncRoadmapMonthsFromStripe } from '@/lib/account/roadmap-sync-client';
import { saveRoadmapCoachContext } from '@/lib/coach/roadmap-coach-context';
import { roadmapDayToCoachContext } from '@/lib/coach/resolve-roadmap-day';
import { COACHING_PHASES } from '@/lib/coach/journey';
import type { BusinessId } from '@/lib/quiz/data';
import { buildPremiumRoadmap, type RoadmapDay } from '@/lib/quiz/premium-roadmap';
import { resolveActiveBusinessId } from '@/lib/quiz/resolve-active-business';
import { TOTAL_ROADMAP_DAYS, getSemesterChapterMeta } from '@/lib/quiz/roadmap-program';
import { useEntrepreneurCopy } from '@/components/EntrepreneurCopyProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface PremiumRoadmapProps {
  businessId: BusinessId | null;
  isSubscribed: boolean;
  variant?: 'full' | 'compact';
  onProgressChange?: (percent: number) => void;
}

export default function PremiumRoadmap({
  businessId,
  isSubscribed,
  variant = 'full',
  onProgressChange,
}: PremiumRoadmapProps) {
  const [progress, setProgress] = useState<RoadmapProgress | null>(null);
  const [openMonth, setOpenMonth] = useState(1);
  const [openWeek, setOpenWeek] = useState(1);
  const [unlockedMonths, setUnlockedMonths] = useState(() =>
    isSubscribed ? getUnlockedRoadmapMonths(loadSubscriptionMeta()) : 0
  );
  const [resolvedBusinessId, setResolvedBusinessId] = useState<BusinessId | null>(
    businessId ?? null
  );
  const router = useRouter();
  const { copy } = useEntrepreneurCopy();

  useEffect(() => {
    setResolvedBusinessId(businessId ?? resolveActiveBusinessId());
  }, [businessId]);

  useEffect(() => {
    function syncBusinessId() {
      setResolvedBusinessId(businessId ?? resolveActiveBusinessId());
    }
    window.addEventListener('buildrai:quiz-profile', syncBusinessId);
    return () => window.removeEventListener('buildrai:quiz-profile', syncBusinessId);
  }, [businessId]);

  useEffect(() => {
    if (!isSubscribed) {
      setUnlockedMonths(0);
      return;
    }
    setUnlockedMonths(getUnlockedRoadmapMonths(loadSubscriptionMeta()));
    void syncRoadmapMonthsFromStripe().then(setUnlockedMonths);
  }, [isSubscribed]);

  const plan = useMemo(
    () =>
      resolvedBusinessId && unlockedMonths > 0
        ? buildPremiumRoadmap(resolvedBusinessId, unlockedMonths)
        : null,
    [resolvedBusinessId, unlockedMonths]
  );

  const refreshProgress = useCallback(() => {
    const activeId = resolvedBusinessId ?? resolveActiveBusinessId();
    if (!activeId || !plan) {
      setProgress(null);
      onProgressChange?.(0);
      return;
    }
    const stored = loadRoadmapProgress();
    const next =
      stored?.businessId === activeId
        ? stored
        : { businessId: activeId, completedDays: [], updatedAt: new Date().toISOString() };
    setProgress(next);
    onProgressChange?.(
      getRoadmapCompletionPercent(next.completedDays, plan.totalUnlockedDays)
    );
  }, [onProgressChange, plan, resolvedBusinessId]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  useEffect(() => {
    if (!plan || variant !== 'full') return;
    const done = new Set(progress?.completedDays ?? []);
    const currentMonth =
      plan.months.find((m) => m.unlocked && m.weeks.some((w) => w.days.some((d) => !done.has(d.day)))) ??
      plan.months.find((m) => m.unlocked) ??
      plan.months[0];
    setOpenMonth(currentMonth.month);
    const firstWeek =
      currentMonth.weeks.find((w) => w.days.some((d) => !done.has(d.day))) ?? currentMonth.weeks[0];
    setOpenWeek(firstWeek?.week ?? 1);
  }, [plan, progress, variant]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ROADMAP_PROGRESS_KEY || e.key === 'buildrai_subscription_meta') {
        const meta = loadSubscriptionMeta();
        setUnlockedMonths(isSubscribed ? getUnlockedRoadmapMonths(meta) : 0);
        refreshProgress();
      }
    };
    const onRoadmapProgress = () => refreshProgress();
    window.addEventListener('storage', onStorage);
    window.addEventListener(ROADMAP_PROGRESS_EVENT, onRoadmapProgress);
    const interval = setInterval(() => {
      if (!isSubscribed) return;
      void syncRoadmapMonthsFromStripe().then((next) => {
        setUnlockedMonths((prev) => (prev !== next ? next : prev));
      });
    }, 5 * 60_000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(ROADMAP_PROGRESS_EVENT, onRoadmapProgress);
      clearInterval(interval);
    };
  }, [isSubscribed, refreshProgress]);

  function handleTalkToCoach(day: RoadmapDay) {
    if (!plan || !resolvedBusinessId) return;
    saveRoadmapCoachContext(roadmapDayToCoachContext(day, resolvedBusinessId, plan.businessName));
    router.push('/espace?section=coach&fromRoadmap=1');
  }

  function handleToggle(day: number, checked: boolean, locked?: boolean) {
    const activeId = resolvedBusinessId ?? resolveActiveBusinessId();
    if (!activeId || !isSubscribed || locked) return;
    const dayMeta = plan?.activeDays.find((d) => d.day === day);
    if (dayMeta?.locked) return;
    const next = toggleRoadmapDay(activeId, day, checked);
    setProgress(next);
    onProgressChange?.(
      getRoadmapCompletionPercent(next.completedDays, plan?.totalUnlockedDays ?? 30)
    );
  }

  if (!isSubscribed) {
    return (
      <section className="premium-roadmap premium-roadmap--locked">
        <div className="premium-roadmap-header">
          <span className="section-tag">Parcours évolutif</span>
          <h3>Parcours personnalisé par modèle business</h3>
          <p>
            Un plan jour par jour sur 180 jours (6 chapitres). Réservé aux
            abonnés Premium.
          </p>
        </div>
        <Link href="/subscribe?plan=starter&period=monthly" className="btn btn-primary">
          Débloquer le parcours
        </Link>
      </section>
    );
  }

  if (!resolvedBusinessId || !plan) {
    return (
      <section className="premium-roadmap premium-roadmap--empty">
        <div className="premium-roadmap-header">
          <span className="section-tag">Parcours évolutif</span>
          <h3>Choisis ton modèle business</h3>
          <p>
            Complète le questionnaire pour générer ton parcours personnalisé jour par jour.
          </p>
        </div>
        <Link href="/espace?section=profil&quiz=1" className="btn btn-primary">
          Compléter le questionnaire
        </Link>
      </section>
    );
  }

  const completed = new Set(progress?.completedDays ?? []);
  const completion = getRoadmapCompletionPercent(
    [...completed],
    plan.totalUnlockedDays
  );
  const activeMonth = plan.months.find((m) => m.month === openMonth) ?? plan.months[0];

  function ProgressRing({
    value,
    size = 88,
    stroke = 7,
    label,
  }: {
    value: number;
    size?: number;
    stroke?: number;
    label?: string;
  }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="premium-roadmap-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle
            className="premium-roadmap-ring-track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
          />
          <circle
            className="premium-roadmap-ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="premium-roadmap-ring-label">
          <strong>{value}%</strong>
          {label && <span>{label}</span>}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    const nextDay =
      plan.activeDays.find((d) => !completed.has(d.day) && !d.locked) ?? plan.activeDays[0];

    return (
      <section className="premium-roadmap premium-roadmap--compact">
        <div className="premium-roadmap-compact-inner">
          <ProgressRing value={completion} size={72} stroke={6} label="fait" />
          <div className="premium-roadmap-compact-copy">
            <span className="premium-roadmap-eyebrow">
              {copy.roadmap.compactEyebrow(plan.unlockedMonths, plan.businessName)}
            </span>
            <h3>Jour {nextDay.dayInMonth}. {nextDay.title}</h3>
            <p>{copy.roadmap.compactHint}</p>
          </div>
          <Link href="/espace?section=parcours" className="btn btn-primary btn-sm">
            Continuer
          </Link>
        </div>
      </section>
    );
  }

  const activeMonthDone = activeMonth.weeks.flatMap((w) => w.days);
  const activeMonthCompleted = activeMonthDone.filter((d) => completed.has(d.day)).length;
  const activeMonthPct = activeMonthDone.length
    ? Math.round((activeMonthCompleted / activeMonthDone.length) * 100)
    : 0;
  const activeMonthMeta = getSemesterChapterMeta(activeMonth.month);

  return (
    <section className="premium-roadmap premium-roadmap--full">
      <header className="premium-roadmap-hero">
        <div className="premium-roadmap-hero-glow" aria-hidden="true" />
        <div className="premium-roadmap-hero-main">
          <div className="premium-roadmap-hero-copy">
            <span className="premium-roadmap-eyebrow">{copy.roadmap.heroEyebrow}</span>
            <h3>
              <span className="premium-roadmap-model-icon">{plan.businessIcon}</span>
              {plan.businessName}
            </h3>
            <p>{copy.roadmap.heroDescription(plan.businessName)}</p>
            <div className="premium-roadmap-stats">
              <span className="premium-roadmap-stat">
                <strong>{plan.unlockedMonths}</strong>
                <small>{copy.roadmap.statMonths}</small>
              </span>
              <span className="premium-roadmap-stat">
                <strong>{completed.size}</strong>
                <small>{copy.roadmap.statDays}</small>
              </span>
              <span className="premium-roadmap-stat">
                <strong>{plan.totalUnlockedDays}</strong>
                <small>{copy.roadmap.statAccessibleDays}</small>
              </span>
              <span className="premium-roadmap-stat">
                <strong>{TOTAL_ROADMAP_DAYS}</strong>
                <small>{copy.roadmap.statTotalDays}</small>
              </span>
            </div>
            <p className="premium-roadmap-unlock-hint">
              Les <strong>6 chapitres</strong> (180 jours) sont accessibles dès ton abonnement. Avance à ton rythme.
            </p>
          </div>
          <ProgressRing value={completion} label="global" />
        </div>
      </header>

      {activeMonth.month === 1 && (
        <div className="premium-roadmap-phases" aria-label="Structure du parcours. 8 étapes coach">
          {COACHING_PHASES.map((phase) => (
            <span key={phase.id} className="premium-roadmap-phase-chip">
              <small>{phase.id}</small>
              {phase.name}
            </span>
          ))}
        </div>
      )}

      <div className="premium-roadmap-timeline-wrap">
        <div className="premium-roadmap-month-tabs" role="tablist" aria-label="Mois du parcours">
          {plan.months.map((monthBlock) => {
            const monthDays = monthBlock.weeks.flatMap((w) => w.days);
            const monthCompleted = monthDays.filter((d) => completed.has(d.day)).length;
            const monthDone =
              monthBlock.unlocked && monthDays.length > 0 && monthCompleted === monthDays.length;

            return (
              <button
                key={monthBlock.month}
                type="button"
                role="tab"
                aria-selected={openMonth === monthBlock.month}
                className={[
                  'premium-roadmap-month-tab',
                  openMonth === monthBlock.month ? 'is-active' : '',
                  monthBlock.unlocked ? '' : 'is-locked',
                  monthDone ? 'is-done' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  if (!monthBlock.unlocked) return;
                  setOpenMonth(monthBlock.month);
                  setOpenWeek(1);
                }}
                disabled={!monthBlock.unlocked}
              >
                <span className="premium-roadmap-month-tab-num">M{monthBlock.month}</span>
                <span className="premium-roadmap-month-tab-label">
                  {monthBlock.unlocked ? monthBlock.label.split('.')[0].trim() : 'À venir'}
                </span>
                {monthBlock.unlocked ? (
                  <span className="premium-roadmap-month-tab-progress">
                    {monthCompleted}/{monthDays.length}
                  </span>
                ) : (
                  <span className="premium-roadmap-month-tab-lock" aria-hidden="true">
                    ◆
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="premium-roadmap-month-panel">
        <div className="premium-roadmap-month-head">
          <div>
            <span className="premium-roadmap-eyebrow">Chapitre {activeMonth.month} / 6</span>
            <h4>{activeMonth.label}</h4>
            {activeMonthMeta && (
              <p className="premium-roadmap-chapter-arc">{activeMonthMeta.arc}</p>
            )}
          </div>
          {activeMonth.unlocked && (
            <div className="premium-roadmap-month-progress">
              <div className="premium-roadmap-month-progress-bar">
                <div style={{ width: `${activeMonthPct}%` }} />
              </div>
              <span>{activeMonthPct}% du mois</span>
            </div>
          )}
        </div>

        {!activeMonth.unlocked && (
          <div className="premium-roadmap-month-locked-msg">
            <span className="premium-roadmap-month-locked-icon" aria-hidden="true">
              ◆
            </span>
            <div>
              <strong>Chapitre indisponible</strong>
              <p>
                Abonne-toi à Premium pour accéder aux 6 chapitres du parcours (180 jours).
              </p>
            </div>
          </div>
        )}

        <div className="premium-roadmap-weeks">
          {activeMonth.weeks.map((week) => {
            const weekCompleted = week.days.filter((d) => completed.has(d.day)).length;
            const weekPct = week.days.length
              ? Math.round((weekCompleted / week.days.length) * 100)
              : 0;
            const weekDone = weekCompleted === week.days.length;
            const isOpen = openWeek === week.week;

            return (
              <article
                key={`${activeMonth.month}-${week.week}`}
                className={`premium-roadmap-week${isOpen ? ' is-open' : ''}${weekDone ? ' is-done' : ''}${!activeMonth.unlocked ? ' is-month-locked' : ''}`}
              >
                <button
                  type="button"
                  className="premium-roadmap-week-toggle"
                  onClick={() => setOpenWeek(isOpen ? 0 : week.week)}
                  aria-expanded={isOpen}
                  disabled={!activeMonth.unlocked}
                >
                  <span className="premium-roadmap-week-index">S{week.week}</span>
                  <span className="premium-roadmap-week-copy">
                    <span className="premium-roadmap-week-label">{week.label}</span>
                    <span className="premium-roadmap-week-sub">
                      {weekCompleted}/{week.days.length} jours. {weekPct}%
                    </span>
                  </span>
                  <span className="premium-roadmap-week-chevron" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && activeMonth.unlocked && (
                  <ol className="premium-roadmap-days">
                    {week.days.map((day, dayIndex) => {
                      const done = completed.has(day.day);
                      const isLast = dayIndex === week.days.length - 1;
                      return (
                        <li
                          key={day.day}
                          className={`premium-roadmap-day${done ? ' is-done' : ''}${isLast ? ' is-last' : ''}`}
                        >
                          <div className="premium-roadmap-day-rail" aria-hidden="true">
                            <button
                              type="button"
                              className={`premium-roadmap-day-dot${done ? ' is-done' : ''}`}
                              aria-label={
                                done
                                  ? `Marquer le jour ${day.dayInMonth} comme non terminé`
                                  : `Marquer le jour ${day.dayInMonth} comme terminé`
                              }
                              onClick={() => handleToggle(day.day, !done, day.locked)}
                            />
                            {!isLast && <span className="premium-roadmap-day-line" />}
                          </div>
                          <div className="premium-roadmap-day-card">
                            <div className="premium-roadmap-day-head">
                              <span className="premium-roadmap-day-marker">Jour {day.dayInMonth}</span>
                              {day.phaseId && day.phaseName && (
                                <span className="premium-roadmap-day-phase">
                                  Étape {day.phaseId}/8. {day.phaseName}
                                </span>
                              )}
                              {done && <span className="premium-roadmap-day-badge">Terminé</span>}
                            </div>
                            <strong>{day.title}</strong>
                            <p className="premium-roadmap-day-objective">{day.objective}</p>
                            <ul className="premium-roadmap-day-tasks">
                              {day.tasks.map((task) => (
                                <li key={task}>{task}</li>
                              ))}
                            </ul>
                            {day.tip && (
                              <p className="premium-roadmap-day-tip">
                                <strong>{plan.businessName}</strong>
                                <span>{day.tip}</span>
                              </p>
                            )}
                            <div className="premium-roadmap-day-actions">
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm premium-roadmap-day-coach"
                                onClick={() => handleTalkToCoach(day)}
                              >
                                En parler avec le coach
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </article>
            );
          })}
        </div>
      </div>

      <div className="premium-roadmap-footer">
        <div className="premium-roadmap-footer-icon" aria-hidden="true">
          ◈
        </div>
        <p>
          Une étape te bloque ? Le <strong>Coach IA</strong> détaille chaque jour selon ton
          modèle {plan.businessName}.
        </p>
        <Link href="/espace?section=coach" className="btn btn-primary btn-sm">
          Ouvrir le coach
        </Link>
      </div>
    </section>
  );
}
