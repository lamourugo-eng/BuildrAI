import { loadAccountAnalytics } from '@/lib/account/analytics-storage';
import { loadLocalNotepad } from '@/lib/account/notepad-storage';
import { getRoadmapCompletionPercent, loadRoadmapProgress } from '@/lib/account/roadmap-storage';
import { hasGrowthAccess } from '@/lib/account/feature-access';
import {
  getUnlockedRoadmapMonths,
  loadSubscriptionMeta,
  MAX_ROADMAP_MONTHS,
} from '@/lib/account/subscription-storage';
import type { BillingPeriod, PlanId } from '@/lib/stripe';
import { computeCitySnapshot } from '@/lib/city/engine';
import { getTotalUnlockedRoadmapDays, TOTAL_ROADMAP_DAYS } from '@/lib/quiz/roadmap-program';
import { loadChosenBusiness, loadQuizProfile } from '@/lib/quiz/profile-storage';
import { getPlanById } from '@/lib/stripe/plans';

export interface ActivitySummary {
  coachMessages: number;
  coachSessions: number;
  lastActiveAt: string | null;
  quizCompletedAt: string | null;
  streakDays: number;
  roadmapCompleted: number;
  roadmapUnlockedDays: number;
  roadmapPercent: number;
  unlockedMonths: number;
  maxMonths: number;
  coachingPhase: number;
  cityLevelName: string;
  cityLevelId: number;
  unlockedBuildings: number;
  totalBuildings: number;
  notepadChars: number;
  businessName: string | null;
  profilePercent: number | null;
  planName: string | null;
  isGrowth: boolean;
  billingPeriod: BillingPeriod | null;
  totalProgramDays: number;
}

/** Texte explicatif sous la barre parcours (hors % affiché). */
export function formatRoadmapActivityDescription(summary: ActivitySummary): string {
  const n = summary.roadmapCompleted;
  const daysLabel = `${n} jour${n !== 1 ? 's' : ''} terminé${n !== 1 ? 's' : ''}`;

  if (summary.unlockedMonths >= summary.maxMonths) {
    return `${daysLabel} sur ${summary.totalProgramDays} jours du programme (6 chapitres. 30 jours chacun). Tous les chapitres sont accessibles dès votre abonnement. Cochez chaque jour au fur et à mesure dans l’onglet Parcours.`;
  }

  return `${daysLabel} sur ${summary.roadmapUnlockedDays} jours accessibles. Abonnez-vous à Premium pour débloquer les 6 chapitres (180 jours).`;
}

export function buildActivitySummary(
  isSubscribed: boolean,
  serverPlanId?: PlanId | null
): ActivitySummary {
  const analytics = loadAccountAnalytics();
  const meta = loadSubscriptionMeta();
  const unlockedDays = isSubscribed
    ? getTotalUnlockedRoadmapDays(getUnlockedRoadmapMonths(meta))
    : 30;
  const city = computeCitySnapshot(analytics, isSubscribed, unlockedDays);
  const profile = loadQuizProfile();
  const businessId = loadChosenBusiness() ?? profile?.topBusinessId ?? null;
  const roadmap = loadRoadmapProgress();
  const notepad = loadLocalNotepad();

  let roadmapCompleted = 0;
  let roadmapPercent = 0;
  if (businessId && roadmap?.businessId === businessId) {
    roadmapCompleted = roadmap.completedDays.length;
    roadmapPercent = getRoadmapCompletionPercent(roadmap.completedDays, unlockedDays);
  }

  const plan = isSubscribed ? getPlanById(meta.planId) : null;
  const totalProgramDays = TOTAL_ROADMAP_DAYS;

  return {
    coachMessages: analytics.coachMessages,
    coachSessions: analytics.coachSessions,
    lastActiveAt: analytics.lastActiveAt,
    quizCompletedAt: analytics.quizCompletedAt,
    streakDays: city.streakDays,
    roadmapCompleted,
    roadmapUnlockedDays: unlockedDays,
    roadmapPercent,
    unlockedMonths: isSubscribed ? getUnlockedRoadmapMonths(meta) : 0,
    maxMonths: MAX_ROADMAP_MONTHS,
    coachingPhase: city.coachingPhase,
    cityLevelName: city.level.name,
    cityLevelId: city.level.id,
    unlockedBuildings: city.unlockedBuildingCount,
    totalBuildings: city.buildings.length,
    notepadChars: notepad.content.length,
    businessName: profile?.topBusinessName ?? null,
    profilePercent: profile?.percent ?? null,
    planName: plan?.name ?? null,
    isGrowth: hasGrowthAccess(isSubscribed, serverPlanId, meta),
    billingPeriod: isSubscribed ? meta.period : null,
    totalProgramDays,
  };
}
