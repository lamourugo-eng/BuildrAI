'use client';

import {
  resolveFounderJourney,
  type FounderJourneyStep,
  type JourneyStepStatus,
} from '@/lib/dashboard/founder-journey';
import type { DashboardSection } from '@/lib/dashboard/sections';
import type { BusinessId } from '@/lib/quiz/data';

interface DashFounderPathProps {
  isSubscribed: boolean;
  hasProfile: boolean;
  businessId: BusinessId | null;
  coachMessages: number;
  roadmapProgress: number;
  onGo: (section: DashboardSection, options?: { quiz?: boolean }) => void;
  variant?: 'full' | 'compact';
}

const STATUS_LABEL: Record<JourneyStepStatus, string> = {
  done: 'Terminé',
  current: 'En cours',
  upcoming: 'À venir',
  locked: 'Verrouillé',
};

function StepNode({ step, onGo }: { step: FounderJourneyStep; onGo: DashFounderPathProps['onGo'] }) {
  const clickable = step.status === 'current' || step.status === 'upcoming' || step.status === 'done';

  return (
    <button
      type="button"
      className={`dash-path-step dash-path-step--${step.status}`}
      onClick={() => {
        if (!clickable || step.status === 'locked') return;
        onGo(step.section, step.id === 'profil' && step.status === 'current' ? { quiz: true } : undefined);
      }}
      disabled={step.status === 'locked'}
      aria-current={step.status === 'current' ? 'step' : undefined}
    >
      <span className="dash-path-step-marker" aria-hidden="true">
        {step.status === 'done' ? '✓' : step.badge ?? step.order}
      </span>
      <span className="dash-path-step-body">
        <strong>{step.label}</strong>
        <span>{step.hint}</span>
      </span>
      <span className="dash-path-step-status">{STATUS_LABEL[step.status]}</span>
    </button>
  );
}

export default function DashFounderPath({
  isSubscribed,
  hasProfile,
  businessId,
  coachMessages,
  roadmapProgress,
  onGo,
  variant = 'full',
}: DashFounderPathProps) {
  const journey = resolveFounderJourney({
    isSubscribed,
    hasProfile,
    businessId,
    coachMessages,
    roadmapProgress,
  });

  if (variant === 'compact') {
    const current = journey.steps.find((s) => s.status === 'current') ?? journey.steps[0];
    return (
      <div className="dash-path-sync" role="status">
        <div className="dash-path-sync-copy">
          <span className="dash-path-sync-kicker">Ta route</span>
          <strong>{journey.headline}</strong>
          {journey.syncNote && <p>{journey.syncNote}</p>}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() =>
            onGo(journey.primarySection, journey.openQuiz ? { quiz: true } : undefined)
          }
        >
          {journey.primaryCta}
        </button>
      </div>
    );
  }

  return (
    <section className="dash-founder-path" aria-labelledby="dash-founder-path-title">
      <header className="dash-founder-path-head">
        <div>
          <span className="dash-founder-path-kicker">Ta route BuildrAI</span>
          <h2 id="dash-founder-path-title">{journey.headline}</h2>
          <p>{journey.summary}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            onGo(journey.primarySection, journey.openQuiz ? { quiz: true } : undefined)
          }
        >
          {journey.primaryCta}
        </button>
      </header>

      {journey.syncNote && (
        <div className="dash-founder-path-sync" role="note">
          <span className="dash-founder-path-sync-icon" aria-hidden="true">
            ◈
          </span>
          <p>{journey.syncNote}</p>
        </div>
      )}

      <div className="dash-path-track" aria-label="Étapes de ton parcours fondateur">
        {journey.steps.map((stepItem, index) => (
          <div key={stepItem.id} className="dash-path-track-item">
            {index > 0 && <span className="dash-path-track-line" aria-hidden="true" />}
            <StepNode step={stepItem} onGo={onGo} />
          </div>
        ))}
      </div>

      {isSubscribed && businessId && journey.roadmapDay && (
        <p className="dash-founder-path-foot">
          Astuce : dans le coach, dis « jour {journey.roadmapDay.day} » pour qu&apos;il t&apos;aide
          sur la tâche du parcours.
        </p>
      )}
    </section>
  );
}
