import { loadCoachMemory } from '@/lib/coach/memory-storage';
import { getPhaseById } from '@/lib/coach/journey';
import { hasFounderAvatar } from '@/lib/city/storage';
import type { DashboardSection } from '@/lib/dashboard/sections';
import type { BusinessId } from '@/lib/quiz/data';
import {
  resolveCurrentRoadmapStep,
  type CurrentRoadmapStep,
} from '@/lib/quiz/current-roadmap-step';

export type JourneyStepStatus = 'done' | 'current' | 'upcoming' | 'locked';

export interface FounderJourneyStep {
  id: string;
  order: number;
  label: string;
  hint: string;
  status: JourneyStepStatus;
  section: DashboardSection;
  badge?: string;
}

export interface FounderJourney {
  headline: string;
  summary: string;
  syncNote?: string;
  steps: FounderJourneyStep[];
  primaryCta: string;
  primarySection: DashboardSection;
  openQuiz?: boolean;
  roadmapDay?: CurrentRoadmapStep['day'];
}

function resolveCoachingPhase(businessId: BusinessId | null, coachMessages: number): number {
  if (businessId) {
    const phase = loadCoachMemory(businessId)?.coachingPhase;
    if (phase && phase >= 1 && phase <= 8) return phase;
  }
  if (coachMessages < 1) return 1;
  return Math.min(8, Math.max(1, Math.floor(coachMessages / 4) + 1));
}

function step(
  partial: Omit<FounderJourneyStep, 'order'> & { order: number }
): FounderJourneyStep {
  return partial;
}

export function resolveFounderJourney(input: {
  isSubscribed: boolean;
  hasProfile: boolean;
  businessId: BusinessId | null;
  coachMessages: number;
  roadmapProgress: number;
}): FounderJourney {
  const hasAvatar = hasFounderAvatar();
  const coachingPhase = resolveCoachingPhase(input.businessId, input.coachMessages);
  const phaseMeta = getPhaseById(coachingPhase);
  const roadmapStep =
    input.businessId && input.isSubscribed
      ? resolveCurrentRoadmapStep(input.businessId, true)
      : null;

  if (!input.hasProfile) {
    return {
      headline: 'Bienvenue dans ton espace',
      summary:
        'On avance en 4 étapes simples. Commence par le quiz : il calibre ton coach et ton parcours.',
      steps: [
        step({
          id: 'profil',
          order: 1,
          label: 'Profil',
          hint: 'Quiz 4 min · modèle business',
          status: 'current',
          section: 'profil',
          badge: '1',
        }),
        step({
          id: 'premium',
          order: 2,
          label: 'Premium',
          hint: 'Coach + parcours 180 j',
          status: 'locked',
          section: 'abonnement',
        }),
        step({
          id: 'coach',
          order: 3,
          label: 'Coach IA',
          hint: '8 étapes guidées',
          status: 'locked',
          section: 'coach',
        }),
        step({
          id: 'parcours',
          order: 4,
          label: 'Mon plan',
          hint: '1 action par jour',
          status: 'locked',
          section: 'parcours',
        }),
      ],
      primaryCta: 'Commencer le quiz',
      primarySection: 'profil',
      openQuiz: true,
    };
  }

  if (!input.isSubscribed) {
    return {
      headline: 'Ton profil est prêt',
      summary:
        'Tu peux déjà voir un aperçu de ton parcours. Passe Premium pour synchroniser coach IA et plan jour par jour.',
      steps: [
        step({
          id: 'profil',
          order: 1,
          label: 'Profil',
          hint: 'Quiz terminé',
          status: 'done',
          section: 'profil',
        }),
        step({
          id: 'premium',
          order: 2,
          label: 'Premium',
          hint: 'Débloque coach + parcours',
          status: 'current',
          section: 'abonnement',
          badge: '2',
        }),
        step({
          id: 'coach',
          order: 3,
          label: 'Coach IA',
          hint: 'Co-pilote ton projet',
          status: 'locked',
          section: 'coach',
        }),
        step({
          id: 'parcours',
          order: 4,
          label: 'Mon plan',
          hint: 'Parcours personnalisé',
          status: 'upcoming',
          section: 'parcours',
        }),
      ],
      primaryCta: 'Voir les formules',
      primarySection: 'abonnement',
    };
  }

  const coachStepStatus: JourneyStepStatus =
    input.coachMessages < 2 ? 'current' : input.roadmapProgress < 10 ? 'upcoming' : 'done';
  const parcoursStepStatus: JourneyStepStatus =
    input.coachMessages < 2
      ? 'upcoming'
      : roadmapStep?.status === 'completed_all'
        ? 'done'
        : 'current';
  const avatarStepStatus: JourneyStepStatus = hasAvatar
    ? 'done'
    : input.coachMessages < 1
      ? 'current'
      : 'upcoming';

  const roadmapPhaseId = roadmapStep?.day.phaseId;
  const phasesAligned =
    !roadmapPhaseId || !coachingPhase || roadmapPhaseId === coachingPhase;

  let syncNote: string | undefined;
  if (roadmapStep && !phasesAligned && input.coachMessages >= 2) {
    const roadmapPhase = getPhaseById(roadmapPhaseId ?? 1);
    syncNote = `Coach (étape ${coachingPhase} · ${phaseMeta?.name}) et parcours (jour ${roadmapStep.day.dayInMonth} · ${roadmapPhase?.name}) parlent du même sujet : avance les deux en parallèle.`;
  } else if (roadmapStep && phasesAligned && input.coachMessages >= 2) {
    syncNote = `Coach et parcours sont alignés sur : ${phaseMeta?.name ?? 'ton étape actuelle'}.`;
  }

  const steps: FounderJourneyStep[] = [
    step({
      id: 'profil',
      order: 1,
      label: 'Profil',
      hint: 'Modèle business calibré',
      status: 'done',
      section: 'profil',
    }),
    step({
      id: 'avatar',
      order: 2,
      label: 'Personnage',
      hint: hasAvatar ? 'Avatar créé' : 'Ma ville · 2 min',
      status: avatarStepStatus,
      section: 'ville',
    }),
    step({
      id: 'coach',
      order: 3,
      label: 'Coach IA',
      hint: phaseMeta
        ? `Étape ${coachingPhase}/8 · ${phaseMeta.name}`
        : `Étape ${coachingPhase}/8`,
      status: coachStepStatus,
      section: 'coach',
      badge: coachStepStatus === 'current' ? String(coachingPhase) : undefined,
    }),
    step({
      id: 'parcours',
      order: 4,
      label: 'Mon plan',
      hint: roadmapStep
        ? roadmapStep.status === 'completed_all'
          ? 'Parcours à jour'
          : `Jour ${roadmapStep.day.dayInMonth} · ${roadmapStep.day.title}`
        : '1 tâche par jour',
      status: parcoursStepStatus,
      section: 'parcours',
      badge:
        parcoursStepStatus === 'current' && roadmapStep
          ? String(roadmapStep.day.dayInMonth)
          : undefined,
    }),
  ];

  let headline = 'Ta route du jour';
  let summary =
    'Coach et parcours avancent ensemble. Suis les étapes ci-dessous dans l’ordre qui te convient.';
  let primaryCta = 'Continuer';
  let primarySection: DashboardSection = 'parcours';

  if (!hasAvatar && input.coachMessages < 1) {
    headline = 'Crée ton personnage';
    summary =
      'Optionnel mais utile : ton avatar dans Ma ville reflète ta progression. Ensuite, ouvre le coach.';
    primaryCta = 'Créer mon personnage';
    primarySection = 'ville';
  } else if (input.coachMessages < 2) {
    headline = 'Parle au coach en premier';
    summary = `Présente ton projet en quelques lignes. Tu es à l’étape ${coachingPhase}/8 : ${phaseMeta?.name ?? 'Vision'}.`;
    primaryCta = 'Ouvrir le coach';
    primarySection = 'coach';
  } else if (roadmapStep && roadmapStep.status !== 'completed_all') {
    headline = `Mon plan · Jour ${roadmapStep.day.dayInMonth}`;
    summary = `${roadmapStep.day.title}. Valide avec le coach si tu bloques, puis coche l’étape dans le parcours.`;
    primaryCta = 'Voir la tâche du jour';
    primarySection = 'parcours';
  } else if (roadmapStep?.status === 'completed_all') {
    headline = 'Parcours à jour';
    summary = 'Enchaîne une session coach pour préparer la suite ou explore les ressources avancées.';
    primaryCta = 'Session coach';
    primarySection = 'coach';
  }

  return {
    headline,
    summary,
    syncNote,
    steps,
    primaryCta,
    primarySection,
    roadmapDay: roadmapStep?.day,
  };
}
