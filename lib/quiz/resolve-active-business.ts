import { isValidBusinessId } from '@/lib/quiz/business-choices';
import type { BusinessId } from '@/lib/quiz/data';
import { loadChosenBusiness, loadQuizProfile } from '@/lib/quiz/profile-storage';

/** Modèle business actif (choix explicite ou résultat quiz). */
export function resolveActiveBusinessId(): BusinessId | null {
  const chosen = loadChosenBusiness();
  if (chosen && isValidBusinessId(chosen)) return chosen;

  const profile = loadQuizProfile();
  if (profile?.topBusinessId && isValidBusinessId(profile.topBusinessId)) {
    return profile.topBusinessId;
  }

  return null;
}
