export interface CoachMemoryContext {
  progressPoint: string;
  lastAction: string;
  sessionSummary?: string;
  coachingPhase?: number;
  coachingStepLabel?: string;
  messageCount: number;
  lastSessionAt: string;
  recentExchanges: { role: string; content: string }[];
}
