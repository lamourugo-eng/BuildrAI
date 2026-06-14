import type { DashboardSection } from '@/lib/dashboard/sections';

export interface DashboardNextStep {
  kicker: string;
  title: string;
  description: string;
  cta: string;
  section: DashboardSection;
}

export function resolveDashboardNextStep(input: {
  isSubscribed: boolean;
  hasProfile: boolean;
  coachMessages: number;
  roadmapProgress: number;
  completedDayNumbers: number[];
}): DashboardNextStep {
  if (!input.hasProfile) {
    return {
      kicker: 'Étape 1',
      title: 'Complète ton profil entrepreneurial',
      description:
        'Le quiz prend 4 minutes. Il calibre ton modèle business, ton coach et ton parcours.',
      cta: 'Faire le quiz',
      section: 'profil',
    };
  }

  if (!input.isSubscribed) {
    return {
      kicker: 'Étape 2',
      title: 'Débloque le coach IA et le parcours 180 jours',
      description:
        'Ton profil est prêt. Passe à Premium pour le plan jour par jour et le coaching personnalisé.',
      cta: 'Voir les formules',
      section: 'abonnement',
    };
  }

  const nextDay =
    input.completedDayNumbers.length > 0 ? Math.max(...input.completedDayNumbers) + 1 : 1;

  if (input.coachMessages < 2) {
    return {
      kicker: 'Pour bien démarrer',
      title: 'Présente ton projet au coach IA',
      description:
        'Décris ton idée en quelques lignes. Le coach t\'aide à structurer ta première action concrète.',
      cta: 'Ouvrir le coach',
      section: 'coach',
    };
  }

  if (input.roadmapProgress < 15) {
    return {
      kicker: 'Parcours',
      title: `Continue ton parcours. Jour ${Math.min(nextDay, 180)}`,
      description:
        'Une tâche par jour, calibrée sur ton modèle business. Coche chaque étape au fur et à mesure.',
      cta: 'Voir mon parcours',
      section: 'parcours',
    };
  }

  return {
    kicker: 'Routine',
    title: 'Coach + parcours. Ta combo du jour',
    description:
      input.roadmapProgress >= 50
        ? 'Tu avances bien. Enchaîne une session coach puis la tâche du jour.'
        : 'Alterne coach et parcours pour garder le rythme et la clarté.',
    cta: 'Continuer le parcours',
    section: 'parcours',
  };
}
