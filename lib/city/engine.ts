import type { AccountAnalyticsData } from '@/lib/account/analytics-storage';
import { getRoadmapCompletionPercent, loadRoadmapProgress } from '@/lib/account/roadmap-storage';
import { loadWeeklyAnalyses } from '@/lib/account/weekly-analysis-storage';
import {
  CITY_BUILDINGS,
  CITY_LEVELS,
  CITY_XP,
  FOUNDER_STYLES,
  type CityBuildingDef,
  type CityLevel,
  type FounderStyle,
} from '@/lib/city/data';
import {
  buildCityAccomplishments,
  formatAccomplishmentSummary,
} from '@/lib/city/accomplishments';
import { sanitizeAvatarForLevel } from '@/lib/city/avatar-unlocks';
import { ENTREPRENEUR_PROFILES, type FounderAvatar } from '@/lib/city/avatar-data';
import { loadCityStorage } from '@/lib/city/storage';

export interface BuildingStatus extends CityBuildingDef {
  unlocked: boolean;
}

export interface CitySnapshot {
  xp: number;
  level: CityLevel;
  nextLevel: CityLevel | null;
  progressToNext: number;
  buildings: BuildingStatus[];
  unlockedBuildingCount: number;
  streakDays: number;
  roadmapProgress: number;
  coachingPhase: number;
  founderStyle: FounderStyle;
  founderName: string;
  avatar: FounderAvatar | null;
  hasAvatar: boolean;
  motivationHint: string;
  /** Accomplissements business affichés à l'utilisateur (sans XP) */
  accomplishments: string[];
  accomplishmentSummary: string;
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

function estimateCoachingPhase(coachMessages: number): number {
  if (coachMessages <= 0) return 1;
  return Math.min(8, Math.floor(coachMessages / 4) + 1);
}

function isBuildingUnlocked(
  buildingId: string,
  ctx: {
    subscribed: boolean;
    quizCompleted: boolean;
    coachMessages: number;
    coachSessions: number;
    streakDays: number;
    roadmapProgress: number;
    roadmapDays: number;
    weeklyReports: number;
    coachingPhase: number;
  }
): boolean {
  switch (buildingId) {
    case 'foundation':
      return ctx.quizCompleted;
    case 'coach_desk':
      return ctx.subscribed && ctx.coachMessages >= 1;
    case 'roadmap_tower':
      return ctx.subscribed && ctx.roadmapProgress >= 25;
    case 'streak_plaza':
      return ctx.subscribed && ctx.streakDays >= 3;
    case 'coach_hq':
      return ctx.subscribed && ctx.coachMessages >= 10;
    case 'roadmap_campus':
      return ctx.subscribed && ctx.roadmapProgress >= 50;
    case 'discipline_monument':
      return ctx.subscribed && ctx.streakDays >= 7;
    case 'innovation_lab':
      return ctx.subscribed && ctx.coachMessages >= 25;
    case 'weekly_observatory':
      return ctx.subscribed && ctx.weeklyReports >= 1;
    case 'roadmap_arch':
      return ctx.subscribed && ctx.roadmapProgress >= 100;
    case 'premium_hq':
      return ctx.subscribed;
    case 'business_district':
      return ctx.subscribed && ctx.coachingPhase >= 7;
    default:
      return false;
  }
}

export function computeCityXp(
  analytics: AccountAnalyticsData,
  subscribed: boolean,
  roadmapProgress: number,
  roadmapDays: number,
  weeklyReports: number,
  coachingPhase: number
): number {
  const storage = loadCityStorage();
  const streakDays = getStreakDays(analytics.dailyMessages);
  const quizCompleted = Boolean(analytics.quizCompletedAt);

  let xp = 0;
  if (quizCompleted) xp += CITY_XP.quiz;
  if (!subscribed) return xp;

  if (storage.welcomeBonusClaimed) xp += CITY_XP.welcomeBonus;
  xp += analytics.coachMessages * CITY_XP.perCoachMessage;
  xp += analytics.coachSessions * CITY_XP.perCoachSession;
  xp += roadmapDays * CITY_XP.perRoadmapDay;
  xp += weeklyReports * CITY_XP.perWeeklyAnalysis;
  xp += Math.max(0, coachingPhase - 1) * CITY_XP.perCoachingPhase;
  if (streakDays >= 3) xp += CITY_XP.streak3;
  if (streakDays >= 7) xp += CITY_XP.streak7;
  if (roadmapProgress >= 50) xp += 20;
  if (roadmapProgress >= 100) xp += 40;

  return xp;
}

export function getLevelForXp(xp: number): CityLevel {
  let level = CITY_LEVELS[0];
  for (const candidate of CITY_LEVELS) {
    if (xp >= candidate.minXp) level = candidate;
  }
  return level;
}

export function getNextLevel(current: CityLevel): CityLevel | null {
  const idx = CITY_LEVELS.findIndex((l) => l.id === current.id);
  if (idx < 0 || idx >= CITY_LEVELS.length - 1) return null;
  return CITY_LEVELS[idx + 1];
}

export function getFounderEmoji(style: FounderStyle): string {
  return FOUNDER_STYLES.find((s) => s.id === style)?.emoji ?? '🏗️';
}

export function computeCitySnapshot(
  analytics: AccountAnalyticsData,
  subscribed: boolean,
  unlockedRoadmapDays = 30
): CitySnapshot {
  const storage = loadCityStorage();
  const streakDays = getStreakDays(analytics.dailyMessages);
  const roadmap = loadRoadmapProgress();
  const roadmapDays = roadmap?.completedDays.length ?? 0;
  const roadmapProgress = getRoadmapCompletionPercent(
    roadmap?.completedDays ?? [],
    unlockedRoadmapDays
  );
  const weeklyReports = loadWeeklyAnalyses().length;
  const coachingPhase = estimateCoachingPhase(analytics.coachMessages);
  const quizCompleted = Boolean(analytics.quizCompletedAt);

  const ctx = {
    subscribed,
    quizCompleted,
    coachMessages: analytics.coachMessages,
    coachSessions: analytics.coachSessions,
    streakDays,
    roadmapProgress,
    roadmapDays,
    weeklyReports,
    coachingPhase,
  };

  const buildings: BuildingStatus[] = CITY_BUILDINGS.map((building) => ({
    ...building,
    unlocked: isBuildingUnlocked(building.id, ctx),
  }));

  const xp = computeCityXp(
    analytics,
    subscribed,
    roadmapProgress,
    roadmapDays,
    weeklyReports,
    coachingPhase
  );
  const level = getLevelForXp(xp);
  const nextLevel = getNextLevel(level);

  let progressToNext = 100;
  if (nextLevel) {
    const range = nextLevel.minXp - level.minXp;
    const current = xp - level.minXp;
    progressToNext = Math.min(100, Math.round((current / range) * 100));
  }

  const avatar = storage.avatar
    ? sanitizeAvatarForLevel(storage.avatar, level.id)
    : null;
  const hasAvatar = Boolean(avatar);

  const accomplishments = buildCityAccomplishments({
    quizCompleted,
    subscribed,
    welcomeBonusClaimed: storage.welcomeBonusClaimed,
    coachMessages: analytics.coachMessages,
    roadmapDays,
    roadmapProgress,
    coachingPhase,
    streakDays,
    weeklyReports,
  });
  const accomplishmentSummary = formatAccomplishmentSummary(accomplishments);
  const motivationHint = accomplishmentSummary;

  const profileToStyle: Record<string, FounderStyle> = {
    tech: 'builder',
    freelance: 'connector',
    creator: 'creative',
    ecommerce: 'builder',
    consultant: 'strategist',
  };

  return {
    xp,
    level,
    nextLevel,
    progressToNext,
    buildings,
    unlockedBuildingCount: buildings.filter((b) => b.unlocked).length,
    streakDays,
    roadmapProgress,
    coachingPhase,
    founderStyle: avatar ? (profileToStyle[avatar.profile] ?? 'builder') : 'builder',
    founderName: avatar?.name ?? 'Fondateur',
    avatar,
    hasAvatar,
    motivationHint,
    accomplishments,
    accomplishmentSummary,
  };
}

export function buildCityPromptBlock(snapshot: CitySnapshot): string {
  const unlocked = snapshot.buildings
    .filter((b) => b.unlocked)
    .slice(-3)
    .map((b) => b.name)
    .join(', ');

  const entrepreneurLine = snapshot.avatar
    ? `- Entrepreneur : ${snapshot.avatar.name} (${ENTREPRENEUR_PROFILES.find((p) => p.id === snapshot.avatar?.profile)?.label ?? snapshot.avatar.profile})`
    : '';

  return `
## Ville entrepreneuriale (gamification)
- Niveau empire : ${snapshot.level.name} (niveau ${snapshot.level.id})
${entrepreneurLine}
- Bâtiments débloqués : ${snapshot.unlockedBuildingCount}/${snapshot.buildings.length}${unlocked ? ` (récents : ${unlocked})` : ''}
- Parcours : ${snapshot.roadmapProgress}%. Phase coach estimée : ${snapshot.coachingPhase}/8
- Étapes franchies (exemples) : ${snapshot.accomplishmentSummary}
- Ne mentionne JAMAIS "XP", "points" ou "Tu as gagné X". Célèbre des étapes business concrètes (marché, offre, landing, prospection…).
- Ne parle jamais d'argent gagné réellement. Parle de compétences, étapes franchies, discipline.`;
}
