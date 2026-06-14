export const ANALYTICS_KEY = 'buildrai_account_analytics';

export interface AccountAnalyticsData {
  coachMessages: number;
  coachSessions: number;
  lastActiveAt: string | null;
  dailyMessages: Record<string, number>;
  quizCompletedAt: string | null;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function defaultAnalytics(): AccountAnalyticsData {
  return {
    coachMessages: 0,
    coachSessions: 0,
    lastActiveAt: null,
    dailyMessages: {},
    quizCompletedAt: null,
  };
}

export function loadAccountAnalytics(): AccountAnalyticsData {
  if (typeof window === 'undefined') return defaultAnalytics();
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    if (!raw) return defaultAnalytics();
    return { ...defaultAnalytics(), ...JSON.parse(raw) };
  } catch {
    return defaultAnalytics();
  }
}

function saveAnalytics(data: AccountAnalyticsData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
}

export function recordCoachSession() {
  const data = loadAccountAnalytics();
  data.coachSessions += 1;
  data.lastActiveAt = new Date().toISOString();
  saveAnalytics(data);
}

export function recordCoachMessage() {
  const data = loadAccountAnalytics();
  const day = todayKey();
  data.coachMessages += 1;
  data.dailyMessages[day] = (data.dailyMessages[day] ?? 0) + 1;
  data.lastActiveAt = new Date().toISOString();
  saveAnalytics(data);
}

export function markQuizCompleted() {
  const data = loadAccountAnalytics();
  if (!data.quizCompletedAt) {
    data.quizCompletedAt = new Date().toISOString();
    saveAnalytics(data);
  }
}

export function getLast7DaysActivity(): { label: string; count: number }[] {
  const data = loadAccountAnalytics();
  const days: { label: string; count: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
    days.push({ label, count: data.dailyMessages[key] ?? 0 });
  }

  return days;
}
