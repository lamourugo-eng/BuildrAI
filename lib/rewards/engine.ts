import type { AccountAnalyticsData } from '@/lib/account/analytics-storage';
import {
  POINTS_PER_MESSAGE,
  POINTS_PER_SESSION,
  QUIZ_BONUS_POINTS,
  REWARD_BADGES,
  REWARD_TIERS,
  STREAK_3_BONUS,
  STREAK_7_BONUS,
  WELCOME_BONUS_POINTS,
  type RewardBadgeDef,
  type RewardTier,
} from '@/lib/rewards/data';
import { loadRewardsStorage } from '@/lib/rewards/storage';

export interface BadgeStatus extends RewardBadgeDef {
  unlocked: boolean;
}

export interface RewardsSnapshot {
  points: number;
  tier: RewardTier;
  nextTier: RewardTier | null;
  progressToNext: number;
  badges: BadgeStatus[];
  unlockedCount: number;
  streakDays: number;
  planProgress: number;
}

export function getStreakDays(dailyMessages: Record<string, number>): number {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if ((dailyMessages[key] ?? 0) > 0) streak++;
    else break;
  }
  return streak;
}

function isBadgeUnlocked(
  badgeId: string,
  ctx: {
    subscribed: boolean;
    quizCompleted: boolean;
    coachMessages: number;
    streakDays: number;
    planProgress: number;
  }
): boolean {
  if (!ctx.subscribed) return false;

  switch (badgeId) {
    case 'premium':
      return ctx.subscribed;
    case 'quiz':
      return ctx.quizCompleted;
    case 'first_chat':
      return ctx.coachMessages >= 1;
    case 'coach_10':
      return ctx.coachMessages >= 10;
    case 'coach_25':
      return ctx.coachMessages >= 25;
    case 'streak_3':
      return ctx.streakDays >= 3;
    case 'streak_7':
      return ctx.streakDays >= 7;
    case 'plan_half':
      return ctx.planProgress >= 50;
    case 'plan_complete':
      return ctx.planProgress >= 100;
    default:
      return false;
  }
}

export function computePoints(
  analytics: AccountAnalyticsData,
  subscribed: boolean
): number {
  if (!subscribed) return 0;

  const storage = loadRewardsStorage();
  const streakDays = getStreakDays(analytics.dailyMessages);
  const quizCompleted = Boolean(analytics.quizCompletedAt);

  let points = 0;
  if (storage.welcomeBonusClaimed) points += WELCOME_BONUS_POINTS;
  if (quizCompleted) points += QUIZ_BONUS_POINTS;
  points += analytics.coachMessages * POINTS_PER_MESSAGE;
  points += analytics.coachSessions * POINTS_PER_SESSION;
  if (streakDays >= 3) points += STREAK_3_BONUS;
  if (streakDays >= 7) points += STREAK_7_BONUS;

  return points;
}

export function getTierForPoints(points: number): RewardTier {
  let tier = REWARD_TIERS[0];
  for (const candidate of REWARD_TIERS) {
    if (points >= candidate.minPoints) tier = candidate;
  }
  return tier;
}

export function getNextTier(currentTier: RewardTier): RewardTier | null {
  const idx = REWARD_TIERS.findIndex((t) => t.id === currentTier.id);
  if (idx < 0 || idx >= REWARD_TIERS.length - 1) return null;
  return REWARD_TIERS[idx + 1];
}

export function computeRewards(
  analytics: AccountAnalyticsData,
  subscribed: boolean
): RewardsSnapshot {
  const streakDays = getStreakDays(analytics.dailyMessages);
  const planProgress = Math.min(100, analytics.coachMessages * 12);
  const quizCompleted = Boolean(analytics.quizCompletedAt);

  const ctx = {
    subscribed,
    quizCompleted,
    coachMessages: analytics.coachMessages,
    streakDays,
    planProgress,
  };

  const badges: BadgeStatus[] = REWARD_BADGES.map((badge) => ({
    ...badge,
    unlocked: isBadgeUnlocked(badge.id, ctx),
  }));

  const points = computePoints(analytics, subscribed);
  const tier = getTierForPoints(points);
  const nextTier = getNextTier(tier);

  let progressToNext = 100;
  if (nextTier) {
    const range = nextTier.minPoints - tier.minPoints;
    const current = points - tier.minPoints;
    progressToNext = Math.min(100, Math.round((current / range) * 100));
  }

  return {
    points,
    tier,
    nextTier,
    progressToNext,
    badges,
    unlockedCount: badges.filter((b) => b.unlocked).length,
    streakDays,
    planProgress,
  };
}
