import { isValidBusinessId } from '@/lib/quiz/business-choices';
import type { BusinessId } from '@/lib/quiz/data';
import { loadRoadmapProgress } from '@/lib/account/roadmap-storage';
import { loadChosenBusiness, loadQuizProfile } from '@/lib/quiz/profile-storage';

/** Modèle business actif (choix explicite, résultat quiz ou parcours en cours). */
export function resolveActiveBusinessId(): BusinessId | null {
  const chosen = loadChosenBusiness();
  if (chosen && isValidBusinessId(chosen)) return chosen;

  const profile = loadQuizProfile();
  if (profile?.topBusinessId && isValidBusinessId(profile.topBusinessId)) {
    return profile.topBusinessId;
  }

  const roadmapBusiness = loadRoadmapProgress()?.businessId;
  if (roadmapBusiness && isValidBusinessId(roadmapBusiness)) {
    return roadmapBusiness;
  }

  return null;
}
