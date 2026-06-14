import { COACHING_PHASES } from '@/lib/coach/journey';

export interface CityProgressActionDef {
  id: string;
  /** Action dans l'app */
  action: string;
  /** Résultat business affiché à l'utilisateur */
  outcome: string;
}

/** Actions qui font grandir la ville — formulées en résultats métier, pas en XP */
export const CITY_PROGRESS_ACTIONS: CityProgressActionDef[] = [
  {
    id: 'quiz',
    action: 'Quiz entrepreneurial',
    outcome: 'Modèle business identifié',
  },
  {
    id: 'premium',
    action: 'Activation Premium',
    outcome: 'Parcours structuré lancé',
  },
  {
    id: 'coach',
    action: 'Échange avec le coach',
    outcome: 'Plan affiné étape par étape',
  },
  {
    id: 'roadmap',
    action: 'Jour coché dans le parcours',
    outcome: 'Exécution quotidienne renforcée',
  },
  {
    id: 'weekly',
    action: 'Analyse hebdomadaire',
    outcome: 'Semaine passée au crible',
  },
  {
    id: 'streak',
    action: 'Série de connexions',
    outcome: 'Régularité installée',
  },
];

const PHASE_OUTCOMES: Record<number, string> = {
  1: 'validé ton marché',
  2: 'défini ton client idéal',
  3: 'structuré ton offre',
  4: 'affiné ton positionnement',
  5: 'créé ta landing page',
  6: 'calibré ton pricing',
  7: 'lancé ta prospection',
  8: 'engagé tes premiers clients',
};

export interface AccomplishmentContext {
  quizCompleted: boolean;
  subscribed: boolean;
  welcomeBonusClaimed: boolean;
  coachMessages: number;
  roadmapDays: number;
  roadmapProgress: number;
  coachingPhase: number;
  streakDays: number;
  weeklyReports: number;
}

function estimateProspectsContacted(coachMessages: number, coachingPhase: number): number {
  if (coachingPhase < 7) return 0;
  const base = 5 + (coachingPhase - 7) * 8;
  return Math.min(20, base + Math.floor(coachMessages / 3));
}

/** Liste ordonnée des accomplissements déjà atteints */
export function buildCityAccomplishments(ctx: AccomplishmentContext): string[] {
  const items: string[] = [];

  if (ctx.quizCompleted) {
    items.push('identifié ton modèle business');
  }

  if (ctx.subscribed && ctx.welcomeBonusClaimed) {
    items.push('activé ton parcours Premium');
  }

  for (let phase = 1; phase < ctx.coachingPhase; phase++) {
    const outcome = PHASE_OUTCOMES[phase];
    if (outcome) items.push(outcome);
  }

  if (ctx.coachMessages >= 1 && ctx.coachingPhase >= 1) {
    const current = PHASE_OUTCOMES[ctx.coachingPhase];
    const messagesInPhase = ctx.coachMessages - (ctx.coachingPhase - 1) * 4;
    if (current && messagesInPhase >= 2) {
      items.push(current);
    }
  }

  const prospects = estimateProspectsContacted(ctx.coachMessages, ctx.coachingPhase);
  if (prospects >= 5) {
    items.push(`contacté ${prospects} prospects`);
  }

  if (ctx.roadmapDays >= 3) {
    items.push(`validé ${ctx.roadmapDays} jours de parcours`);
  } else if (ctx.roadmapDays >= 1) {
    items.push('démarré ton exécution quotidienne');
  }

  if (ctx.streakDays >= 7) {
    items.push(`tenu ${ctx.streakDays} jours de régularité`);
  } else if (ctx.streakDays >= 3) {
    items.push('installé une routine entrepreneuriale');
  }

  if (ctx.weeklyReports >= 1) {
    items.push('analysé ta semaine entrepreneuriale');
  }

  if (ctx.roadmapProgress >= 100) {
    items.push('complété ton parcours débloqué');
  } else if (ctx.roadmapProgress >= 50) {
    items.push('passé la moitié de ton parcours');
  }

  return [...new Set(items)];
}

export function formatAccomplishmentSummary(items: string[], maxItems = 3): string {
  if (items.length === 0) {
    return 'Commence par le quiz, puis une première action avec le coach.';
  }

  const selected = pickHighlightAccomplishments(items, maxItems);

  if (selected.length === 1) {
    return `Tu as ${selected[0]}.`;
  }

  const last = selected[selected.length - 1];
  const rest = selected.slice(0, -1);
  return `Tu as ${rest.join(', ')} et ${last}.`;
}

/** Priorise les étapes les plus parlantes (marché, landing, prospects…) */
function pickHighlightAccomplishments(items: string[], maxItems: number): string[] {
  const priority = [
    'complété ton parcours débloqué',
    'passé la moitié de ton parcours',
    'engagé tes premiers clients',
    'contacté',
    'créé ta landing page',
    'validé ton marché',
    'lancé ta prospection',
    'calibré ton pricing',
    'affiné ton positionnement',
    'structuré ton offre',
    'défini ton client idéal',
  ];

  const scored = items.map((item, index) => {
    const rank =
      priority.findIndex((key) => item.includes(key)) >= 0
        ? priority.findIndex((key) => item.includes(key))
        : 50 + index;
    return { item, rank, index };
  });

  scored.sort((a, b) => a.rank - b.rank || a.index - b.index);
  return scored.slice(0, maxItems).map((entry) => entry.item);
}

export function getCoachingPhaseLabel(phase: number): string {
  return COACHING_PHASES.find((p) => p.id === phase)?.name ?? `Phase ${phase}`;
}
