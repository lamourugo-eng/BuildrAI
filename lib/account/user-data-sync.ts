import { hydrateRoadmapProgressFromServer, syncRoadmapProgressToServer } from '@/lib/account/roadmap-sync';
import { hydrateCityDataFromServer, syncCityDataToServer } from '@/lib/city/city-sync';
import {
  hydrateQuizProfileFromServer,
  syncQuizProfileToServer,
} from '@/lib/quiz/profile-sync';

/** Restaure quiz, personnage et parcours depuis Supabase. */
export async function hydrateUserDataFromServer(): Promise<void> {
  await Promise.all([
    hydrateQuizProfileFromServer(),
    hydrateCityDataFromServer(),
    hydrateRoadmapProgressFromServer(),
  ]);
}

/** Pousse les données locales vers Supabase (après connexion ou quiz hors-ligne). */
export async function pushLocalUserDataToServer(): Promise<void> {
  await Promise.all([
    syncQuizProfileToServer(),
    syncCityDataToServer(),
    syncRoadmapProgressToServer(),
  ]);
}
