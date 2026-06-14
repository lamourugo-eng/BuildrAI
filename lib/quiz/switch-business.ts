import { clearCoachMemory } from '@/lib/coach/memory-storage';
import type { BusinessId } from '@/lib/quiz/data';
import { saveChosenBusiness } from '@/lib/quiz/profile-storage';
import { syncQuizProfileToServer } from '@/lib/quiz/profile-sync';

export const BUSINESS_CHANGED_EVENT = 'buildrai-business-changed';

export function notifyBusinessChanged(businessId: BusinessId) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(BUSINESS_CHANGED_EVENT, { detail: { businessId } })
  );
}

/** Change le modèle actif et efface la mémoire coach du modèle quitté. */
export async function switchActiveBusiness(
  previousBusinessId: BusinessId,
  nextBusinessId: BusinessId
): Promise<void> {
  if (previousBusinessId === nextBusinessId) return;

  try {
    const res = await fetch(`/api/coach/memory?businessId=${previousBusinessId}`, {
      method: 'DELETE',
    });
    if (res.status !== 401 && !res.ok) {
      /* mémoire produit absente ou non connecté. On continue */
    }
  } catch {
    /* ignore */
  }

  clearCoachMemory(previousBusinessId);
  saveChosenBusiness(nextBusinessId);
  notifyBusinessChanged(nextBusinessId);
  void syncQuizProfileToServer(undefined, nextBusinessId);
}
