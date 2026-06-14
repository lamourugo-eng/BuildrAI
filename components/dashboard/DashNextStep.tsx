'use client';

import { resolveDashboardNextStep } from '@/lib/dashboard/next-step';
import type { DashboardSection } from '@/lib/dashboard/sections';

interface DashNextStepProps {
  isSubscribed: boolean;
  hasProfile: boolean;
  coachMessages: number;
  roadmapProgress: number;
  completedDayNumbers: number[];
  onGo: (section: DashboardSection) => void;
}

export default function DashNextStep({
  isSubscribed,
  hasProfile,
  coachMessages,
  roadmapProgress,
  completedDayNumbers,
  onGo,
}: DashNextStepProps) {
  const step = resolveDashboardNextStep({
    isSubscribed,
    hasProfile,
    coachMessages,
    roadmapProgress,
    completedDayNumbers,
  });

  return (
    <section className="dash-next-step" aria-labelledby="dash-next-step-title">
      <div className="dash-next-step-copy">
        <span className="dash-next-step-kicker">{step.kicker}</span>
        <h3 id="dash-next-step-title">{step.title}</h3>
        <p>{step.description}</p>
      </div>
      <button type="button" className="btn btn-primary" onClick={() => onGo(step.section)}>
        {step.cta}
      </button>
    </section>
  );
}
