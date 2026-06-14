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
  const local = loadQuizProfile();
  const localChosen = loadChosenBusiness();

  try {
    const res = await fetch('/api/user/quiz-profile', { method: 'GET', cache: 'no-store' });

    if (res.status === 401) {
      return local;
    }

    if (!res.ok) {
      if (local) void syncQuizProfileToServer(local, localChosen);
      return local;
    }

    const data = (await res.json()) as {
      profile?: QuizProfileSnapshot | null;
      chosenBusiness?: BusinessId | null;
    };

    const serverProfile = isValidSnapshot(data.profile) ? data.profile : null;
    const serverChosen = data.chosenBusiness ?? null;

    if (serverProfile) {
      saveQuizProfile(serverProfile);
    } else if (local) {
      void syncQuizProfileToServer(local, localChosen);
    }

    if (serverChosen) {
      saveChosenBusiness(serverChosen);
    }

    return loadQuizProfile();
  } catch {
    if (local) void syncQuizProfileToServer(local, localChosen);
    return local;
  }
}
