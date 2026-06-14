import { getBusinessMatchPercent, isValidBusinessId } from './business-choices';
import { businessProfiles, type BusinessId } from './data';

export const QUIZ_PROFILE_KEY = 'buildrai_quiz_profile';
export const CHOSEN_BUSINESS_KEY = 'buildrai_chosen_business';

const LEGACY_QUIZ_PROFILE_KEY = 'foundermind_quiz_profile';
const LEGACY_CHOSEN_BUSINESS_KEY = 'foundermind_chosen_business';

export interface QuizProfileSnapshot {
  topBusinessId: BusinessId;
  topBusinessName: string;
  personalityLabel: string;
  personalityDesc: string;
  percent: number;
  top3: { id: BusinessId; name: string; percent: number }[];
  firstSteps: string[];
  entrepreneurialLevel: string;
  entrepreneurialLevelDesc: string;
  techLevel: string;
  techLevelDesc: string;
  investmentLevel: string;
  investmentLevelDesc: string;
}

export function buildQuizProfileSnapshot(
  top3: { id: BusinessId; percent: number }[],
  personality: { label: string; desc: string },
  levels?: {
    entrepreneurial: { label: string; desc: string };
    tech: { label: string; desc: string };
    investment: { label: string; desc: string };
  },
  options?: { firstSteps?: string[] }
): QuizProfileSnapshot | null {
  const top = top3[0];
  if (!top) return null;

  const profile = businessProfiles[top.id];
  return {
    topBusinessId: top.id,
    topBusinessName: profile.name,
    personalityLabel: personality.label,
    personalityDesc: personality.desc,
    percent: top.percent,
    top3: top3.map((item) => ({
      id: item.id,
      name: businessProfiles[item.id].name,
      percent: item.percent,
    })),
    firstSteps: options?.firstSteps ?? profile.firstSteps,
    entrepreneurialLevel: levels?.entrepreneurial.label ?? 'Non renseigné',
    entrepreneurialLevelDesc: levels?.entrepreneurial.desc ?? '',
    techLevel: levels?.tech.label ?? 'Non renseigné',
    techLevelDesc: levels?.tech.desc ?? '',
    investmentLevel: levels?.investment.label ?? 'Non renseigné',
    investmentLevelDesc: levels?.investment.desc ?? '',
  };
}

export function saveQuizProfile(snapshot: QuizProfileSnapshot): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUIZ_PROFILE_KEY, JSON.stringify(snapshot));
  window.dispatchEvent(new Event('buildrai:quiz-profile'));
}

export function loadQuizProfile(): QuizProfileSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem(QUIZ_PROFILE_KEY) ??
      localStorage.getItem(LEGACY_QUIZ_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuizProfileSnapshot>;
    if (!parsed.topBusinessId) return null;
    const freshSteps = businessProfiles[parsed.topBusinessId]?.firstSteps;
    return {
      ...parsed,
      firstSteps: freshSteps ?? parsed.firstSteps ?? [],
      entrepreneurialLevel: parsed.entrepreneurialLevel ?? 'Non renseigné',
      entrepreneurialLevelDesc: parsed.entrepreneurialLevelDesc ?? '',
      techLevel: parsed.techLevel ?? 'Non renseigné',
      techLevelDesc: parsed.techLevelDesc ?? '',
      investmentLevel: parsed.investmentLevel ?? 'Non renseigné',
      investmentLevelDesc: parsed.investmentLevelDesc ?? '',
    } as QuizProfileSnapshot;
  } catch {
    return null;
  }
}

export function saveChosenBusiness(businessId: BusinessId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHOSEN_BUSINESS_KEY, businessId);
}

export function loadChosenBusiness(): BusinessId | null {
  if (typeof window === 'undefined') return null;
  return (
    (localStorage.getItem(CHOSEN_BUSINESS_KEY) as BusinessId | null) ??
    (localStorage.getItem(LEGACY_CHOSEN_BUSINESS_KEY) as BusinessId | null)
  );
}

/** Profil coach avec le modèle business actif (choix libre parmi tous les modèles). */
export function buildActiveCoachProfile(
  snapshot: QuizProfileSnapshot,
  businessId: BusinessId
): QuizProfileSnapshot {
  const profile = businessProfiles[businessId];
  if (!profile) return snapshot;

  const matchPercent = getBusinessMatchPercent(snapshot.top3, businessId);

  return {
    ...snapshot,
    topBusinessId: businessId,
    topBusinessName: profile.name,
    percent: matchPercent ?? snapshot.percent,
    firstSteps: profile.firstSteps,
  };
}

export function resolveCoachProfile(snapshot: QuizProfileSnapshot): {
  businessId: BusinessId;
  activeProfile: QuizProfileSnapshot;
} {
  const savedChoice = loadChosenBusiness();
  const businessId =
    savedChoice && isValidBusinessId(savedChoice) ? savedChoice : snapshot.topBusinessId;

  return {
    businessId,
    activeProfile: buildActiveCoachProfile(snapshot, businessId),
  };
}
