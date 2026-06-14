import type { BusinessId } from '@/lib/quiz/data';
import {
  loadChosenBusiness,
  loadQuizProfile,
  saveChosenBusiness,
  saveQuizProfile,
  type QuizProfileSnapshot,
} from '@/lib/quiz/profile-storage';

function isValidSnapshot(raw: unknown): raw is QuizProfileSnapshot {
  if (!raw || typeof raw !== 'object') return false;
  const profile = raw as Partial<QuizProfileSnapshot>;
  return typeof profile.topBusinessId === 'string' && Boolean(profile.topBusinessId);
}

export async function syncQuizProfileToServer(
  snapshot?: QuizProfileSnapshot | null,
  chosenBusiness?: BusinessId | null
): Promise<boolean> {
  const profile = snapshot ?? loadQuizProfile();
  if (!profile) return false;

  const chosen = chosenBusiness ?? loadChosenBusiness();

  try {
    const res = await fetch('/api/user/quiz-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile,
        chosenBusiness: chosen,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function hydrateQuizProfileFromServer(): Promise<QuizProfileSnapshot | null> {
  try {
    const res = await fetch('/api/user/quiz-profile', { method: 'GET' });
    if (!res.ok) return loadQuizProfile();

    const data = (await res.json()) as {
      profile?: QuizProfileSnapshot | null;
      chosenBusiness?: BusinessId | null;
    };

    const local = loadQuizProfile();

    if (data.profile && isValidSnapshot(data.profile)) {
      if (!local) {
        saveQuizProfile(data.profile);
      }
    } else if (local) {
      void syncQuizProfileToServer(local, loadChosenBusiness());
    }

    if (data.chosenBusiness && !loadChosenBusiness()) {
      saveChosenBusiness(data.chosenBusiness);
    }

    return loadQuizProfile();
  } catch {
    return loadQuizProfile();
  }
}
