export const WEEKLY_ANALYSIS_KEY = 'buildrai_weekly_analyses';

export interface WeeklyAnalysisScores {
  momentum: number;
  consistency: number;
  roadmapAlignment: number;
}

/** Instantané parcours/coach au moment de la génération. */
export interface WeeklyAnalysisSyncSnapshot {
  roadmapDay: number;
  roadmapDayTitle: string;
  chapter: number;
  chapterLabel: string;
  completedDays: number;
  unlockedDays: number;
  percentUnlocked: number;
  coachingPhase: number | null;
  coachingStepLabel: string | null;
  expectedCoachPhase: number;
  coachMemorySource: 'cloud' | 'local' | 'none';
}

export interface WeeklyAnalysisSection {
  title: string;
  content: string;
}

export interface WeeklyAnalysisReport {
  weekKey: string;
  periodLabel: string;
  generatedAt: string;
  summary: string;
  sections: WeeklyAnalysisSection[];
  priorities: string[];
  risks: string[];
  scores: WeeklyAnalysisScores;
  syncSnapshot?: WeeklyAnalysisSyncSnapshot | null;
}

function defaultStore(): WeeklyAnalysisReport[] {
  return [];
}

export function getWeekKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function formatWeekPeriodLabel(weekKey: string): string {
  const start = new Date(weekKey);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (value: Date) =>
    value.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function loadWeeklyAnalyses(): WeeklyAnalysisReport[] {
  if (typeof window === 'undefined') return defaultStore();
  try {
    const raw = localStorage.getItem(WEEKLY_ANALYSIS_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as WeeklyAnalysisReport[];
    return Array.isArray(parsed) ? parsed : defaultStore();
  } catch {
    return defaultStore();
  }
}

export function saveWeeklyAnalysis(report: WeeklyAnalysisReport): void {
  if (typeof window === 'undefined') return;
  const existing = loadWeeklyAnalyses().filter((item) => item.weekKey !== report.weekKey);
  localStorage.setItem(
    WEEKLY_ANALYSIS_KEY,
    JSON.stringify([report, ...existing].slice(0, 12))
  );
}

export function getCurrentWeekAnalysis(): WeeklyAnalysisReport | null {
  const weekKey = getWeekKey();
  return loadWeeklyAnalyses().find((item) => item.weekKey === weekKey) ?? null;
}

export function canGenerateWeeklyAnalysis(
  reports: WeeklyAnalysisReport[] = loadWeeklyAnalyses()
): boolean {
  const weekKey = getWeekKey();
  return !reports.some((item) => item.weekKey === weekKey);
}

export function getNextWeeklyAnalysisDate(): string | null {
  const current = getCurrentWeekAnalysis();
  if (!current) return null;
  const nextMonday = new Date(current.weekKey);
  nextMonday.setDate(nextMonday.getDate() + 7);
  return nextMonday.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
}
