import { getCoachMemoryContext, loadCoachMemory } from '@/lib/coach/memory-storage';
import { getPhaseById } from '@/lib/coach/journey';
import type { BusinessId } from '@/lib/quiz/data';

export interface WeeklyCoachSnapshot {
  progressPoint: string;
  lastAction: string;
  messageCount: number;
  coachingPhase: number;
  coachingStepLabel: string;
  sessionSummary: string;
  recentExchanges: { role: string; content: string }[];
  source: 'cloud' | 'local' | 'none';
}

async function fetchCloudCoachContext(
  businessId: BusinessId
): Promise<WeeklyCoachSnapshot | null> {
  const res = await fetch(`/api/coach/memory?businessId=${businessId}`);
  if (res.status === 401 || !res.ok) return null;

  const data = await res.json();
  const ctx = data.memory?.context;
  if (!ctx) return null;

  const phase = ctx.coachingPhase ?? 1;
  return {
    progressPoint: ctx.progressPoint ?? '',
    lastAction: ctx.lastAction ?? '',
    messageCount: ctx.messageCount ?? 0,
    coachingPhase: phase,
    coachingStepLabel: ctx.coachingStepLabel || getPhaseById(phase)?.name || '',
    sessionSummary: ctx.sessionSummary ?? '',
    recentExchanges: (ctx.recentExchanges ?? []).map(
      (m: { role: string; content: string }) => ({
        role: m.role,
        content: String(m.content).slice(0, 500),
      })
    ),
    source: 'cloud',
  };
}

function buildLocalCoachSnapshot(businessId: BusinessId): WeeklyCoachSnapshot | null {
  const memory = loadCoachMemory(businessId);
  const ctx = getCoachMemoryContext(memory);
  if (!ctx) return null;

  const phase = ctx.coachingPhase ?? 1;
  return {
    progressPoint: ctx.progressPoint,
    lastAction: ctx.lastAction,
    messageCount: ctx.messageCount,
    coachingPhase: phase,
    coachingStepLabel: ctx.coachingStepLabel || getPhaseById(phase)?.name || '',
    sessionSummary: ctx.sessionSummary ?? '',
    recentExchanges: ctx.recentExchanges,
    source: 'local',
  };
}

/** Mémoire coach : cloud prioritaire, repli localStorage. */
export async function resolveWeeklyCoachSnapshot(
  businessId: BusinessId
): Promise<WeeklyCoachSnapshot | null> {
  try {
    const cloud = await fetchCloudCoachContext(businessId);
    if (cloud) return cloud;
  } catch {
    /* repli local */
  }

  return buildLocalCoachSnapshot(businessId);
}
