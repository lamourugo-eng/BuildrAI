import { COACH_CONCISENESS_PROMPT, COACH_LENGTH_QUESTION } from '@/lib/coach/concise-style';
import { COACH_QA_MODE_PROMPT } from '@/lib/coach/interaction-mode';
import { buildContextualToolsPromptReference } from '@/lib/coach/contextual-tools';
import { buildBusinessCoachExpertBlock } from '@/lib/coach/business-coach-context';
import {
  buildCoachDayCompletedMessage,
  buildCoachNextActionPresentation,
  buildRoadmapCompletedRecap,
  buildRoadmapProgressHeader,
  buildRoadmapTasksProgressBlock,
  getNextPendingTaskIndex,
} from '@/lib/coach/roadmap-task-sync';
import { buildRoadmapMemorySnippet, buildQuestionMemoryPromptBlock, truncateNotepadForPrompt } from '@/lib/coach/prompt-memory';
import type { CoachMemoryContext } from '@/lib/coach/memory-context';
import { getCoachLanguageBlock, resolveCopyTier } from '@/lib/copy/entrepreneur-level';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import { TOTAL_ROADMAP_DAYS } from '@/lib/quiz/roadmap-program';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';

export const ROADMAP_COACH_CONTEXT_KEY = 'buildrai_roadmap_coach_context';
export const ROADMAP_COACH_ACTIVE_KEY = 'buildrai_roadmap_coach_active';

export interface RoadmapCoachContext {
  day: number;
  dayInMonth: number;
  month: number;
  title: string;
  objective: string;
  tasks: string[];
  tip?: string;
  businessId?: BusinessId;
  businessName?: string;
  phaseId?: number;
  phaseName?: string;
}

export const ROADMAP_COACH_MODE_PROMPT = `Tu es BuildrAI Coach. Mode **Parcours premium (${TOTAL_ROADMAP_DAYS} jours)** — **flux séquentiel strict**.

## Mission
Guider le client **action par action** sur le jour en cours. Une seule action visible à la fois.

## Comportement obligatoire
1. **Présentation** : uniquement l'action en cours (format ### Action N/Total + consigne). Jamais la liste des autres actions.
2. **Attente** : le client doit envoyer **son** livrable (texte, choix B2B/B2C, liste…). Tu guides, tu ne fais pas l'exercice à sa place.
3. **Validation Mon plan** : uniquement si le livrable est dans le message client → ligne exacte « ✅ Action N validée : [résumé court] ».
4. **Enchaînement** : dans le **même** message, après la validation, présente l'action suivante (### Action N+1/Total).
5. **Questions** : si le client pose une question sur l'action en cours, réponds brièvement puis rappelle ce qu'il doit envoyer. Ne valide pas sans livrable.
6. **Reprise** : si des actions sont déjà validées (voir progression), ne les redemande pas. Enchaîne directement sur l'action en cours.

## Interdit
- Lister plusieurs actions du jour d'un coup
- Valider sur « continuer », « reprendre mon plan », « où j'en suis »
- Valider sans livrable client dans le message
- Répéter à chaque message le bloc « Jour X / chapitre / objectif / étape coach » (contexte déjà connu)
- Écrire le livrable final à la place du client
- Format 8 étapes coach (SITUATION / PARCOURS / PLAN) sauf demande explicite
- « Bloc Focus » ou conseils de gestion du temps génériques

## Outils
Reddit (+ subreddit), Typeform, Cal.com, Stripe… Jamais « cherche sur des forums » sans nommer Reddit ou Indie Hackers.

- ${COACH_LENGTH_QUESTION}

${COACH_CONCISENESS_PROMPT}`;

export const ROADMAP_COACH_QUESTION_PROMPT = `Tu es BuildrAI Coach. Le client pose une **question libre** pendant son parcours Mon plan.

## Comportement obligatoire
1. **Réponds d'abord** clairement et complètement à la question (définition, conseil, exemple concret).
2. **Ne valide aucune action** Mon plan : pas de ligne « ✅ Action N validée ».
3. **Ne présente pas** le bloc ### Action N/Total ni ne renvoies vers l'exercice en cours — sauf si le client demande explicitement à reprendre le plan.
4. Tu peux faire **un lien court** avec l'action en cours si c'est pertinent (ex. « Utile pour ton action persona »), sans imposer l'exercice.
5. Structure libre et pédagogique. Pas de format 8 étapes coach (SITUATION / PARCOURS / PLAN).

${COACH_QA_MODE_PROMPT}`;


export function buildRoadmapCoachWelcome(
  ctx: RoadmapCoachContext,
  _businessName: string,
  completedTaskIndices: number[] = [],
  options?: { includeDayIntro?: boolean }
): string {
  const nextIndex = getNextPendingTaskIndex(ctx.tasks, completedTaskIndices);

  if (nextIndex < 0) {
    return buildCoachDayCompletedMessage(ctx);
  }

  const doneCount = completedTaskIndices.length;
  const variant = doneCount > 0 ? 'resume' : 'intro';
  const actionBlock = buildCoachNextActionPresentation(ctx, nextIndex, doneCount, { variant });

  if (doneCount > 0) {
    const header = buildRoadmapProgressHeader(ctx, completedTaskIndices);
    const recap = buildRoadmapCompletedRecap(ctx, completedTaskIndices);
    return `${header}${recap ? `\n\n${recap}` : ''}\n\n${actionBlock}`;
  }

  if (options?.includeDayIntro !== false) {
    const phaseLine = ctx.phaseName ? `\n_${ctx.phaseName}_` : '';
    return `**Jour ${ctx.dayInMonth}** — ${ctx.title}${phaseLine}\n\n${actionBlock}`;
  }

  return actionBlock;
}

export function saveRoadmapCoachContext(ctx: RoadmapCoachContext): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ROADMAP_COACH_CONTEXT_KEY, JSON.stringify(ctx));
  persistActiveRoadmapCoachContext(ctx);
}

export function persistActiveRoadmapCoachContext(ctx: RoadmapCoachContext): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ROADMAP_COACH_ACTIVE_KEY, JSON.stringify(ctx));
}

export function loadActiveRoadmapCoachContext(): RoadmapCoachContext | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(ROADMAP_COACH_ACTIVE_KEY);
  if (!raw) return null;
  try {
    return parseRoadmapCoachContext(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearActiveRoadmapCoachContext(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ROADMAP_COACH_ACTIVE_KEY);
}

export function consumeRoadmapCoachContext(): RoadmapCoachContext | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(ROADMAP_COACH_CONTEXT_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(ROADMAP_COACH_CONTEXT_KEY);
  try {
    const parsed = JSON.parse(raw) as RoadmapCoachContext;
    if (!parsed?.title || typeof parsed.day !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Bloc injecté dans le prompt système quand l'utilisateur vient du parcours premium. */
export function buildRoadmapCoachSystemBlock(
  ctx: RoadmapCoachContext,
  completedTaskIndices: number[] = []
): string {
  const phaseLine = ctx.phaseName ? `\n- Phase coach liée : ${ctx.phaseName}` : '';
  const nextIndex = getNextPendingTaskIndex(ctx.tasks, completedTaskIndices);
  const currentTaskLine =
    nextIndex >= 0
      ? `\n- Action en cours (seule à traiter) : ${ctx.tasks[nextIndex]}`
      : '\n- Toutes les actions du jour sont validées.';
  const tipLine = ctx.tip && nextIndex === 0 ? `\n- Conseil modèle : ${ctx.tip}` : '';
  const progressLine = ctx.tasks.length
    ? `\n\n${buildRoadmapTasksProgressBlock(ctx, completedTaskIndices)}`
    : '';

  return `L'utilisateur pose une question sur le **jour ${ctx.dayInMonth}** du parcours premium (chapitre ${ctx.month}, **jour global ${ctx.day}/${TOTAL_ROADMAP_DAYS}**) :
- Titre : ${ctx.title}
- Objectif : ${ctx.objective}${phaseLine}${currentTaskLine}${tipLine}${progressLine}

Tu connais l'intégralité du parcours (${TOTAL_ROADMAP_DAYS} jours). Ici, concentre-toi sur **l'action en cours uniquement** (mode séquentiel). Ne liste pas les actions futures.`;
}

/** Consigne interne ajoutée au message utilisateur côté API. */
export function buildRoadmapCoachReminder(
  ctx: RoadmapCoachContext,
  completedTaskIndices: number[] = []
): string {
  const nextIndex = getNextPendingTaskIndex(ctx.tasks, completedTaskIndices);
  const hasNext = nextIndex >= 0 && nextIndex + 1 < ctx.tasks.length;
  const focusHint =
    nextIndex >= 0
      ? hasNext
        ? ` STRICT : Action ${nextIndex + 1} seule. Livrable reçu → ligne « ✅ Action ${nextIndex + 1} validée : … » PUIS immédiatement ### Action ${nextIndex + 2}/${ctx.tasks.length} dans le MÊME message. Pas de répétition du contexte jour.`
        : ` Dernière action (${nextIndex + 1}). Livrable reçu → valide puis félicite.`
      : ' Jour terminé.';
  return `[Parcours jour ${ctx.day}. Action ${nextIndex >= 0 ? nextIndex + 1 : '—'}/${ctx.tasks.length}]${focusHint} Feedback court OK, mais enchaîne toujours sur l'action suivante si livrable reçu. 80–200 mots max.`;
}

/** Consigne interne pour une question libre pendant Mon plan. */
export function buildRoadmapCoachQuestionReminder(
  ctx: RoadmapCoachContext,
  completedTaskIndices: number[] = []
): string {
  const nextIndex = getNextPendingTaskIndex(ctx.tasks, completedTaskIndices);
  const actionHint =
    nextIndex >= 0
      ? ` Action en cours (ne pas présenter sauf demande) : ${nextIndex + 1}/${ctx.tasks.length}.`
      : '';
  return `[Question libre Mon plan — réponds DIRECTEMENT et COMPLÈTEMENT à la question du client. Ignore tout livrable ou message précédent (phrase transformation, offre, persona rédigée…) sauf si la question s'y rapporte. Ne valide aucune action. Pas de bloc ### Action.${actionHint}]`;
}

export function buildRoadmapCoachQuestionSystemPrompt(
  profile: QuizProfileSnapshot | null | undefined,
  ctx: RoadmapCoachContext,
  memory?: CoachMemoryContext | null,
  notepadSnippet?: string,
  completedTaskIndices: number[] = []
): string {
  const memoryBlock = buildQuestionMemoryPromptBlock(memory, notepadSnippet);

  const businessBlock = (() => {
    const businessId =
      ctx.businessId ??
      (profile?.topBusinessId as BusinessId | undefined);

    if (businessId && businessProfiles[businessId]) {
      const biz = businessProfiles[businessId];
      const languageBlock = profile
        ? getCoachLanguageBlock(resolveCopyTier(profile.entrepreneurialLevel))
        : '';
      const expertBlock = buildBusinessCoachExpertBlock(businessId, {
        phaseId: ctx.phaseId,
        techLevel: profile?.techLevel,
        compact: true,
      });

      return `
${languageBlock}

## Profil client
- Modèle : ${ctx.businessName ?? profile?.topBusinessName ?? biz.name}
- Personnalité : ${profile?.personalityLabel ?? '—'}
- Niveau : ${profile?.entrepreneurialLevel ?? 'Non renseigné'}
- Budget : ${profile?.investmentLevel ?? 'Non renseigné'}
- Tech : ${profile?.techLevel ?? 'Non renseigné'}

${expertBlock}`;
    }

    if (ctx.businessName) {
      return `\n## Modèle business\n- ${ctx.businessName}`;
    }
    return '';
  })();

  const nextIndex = getNextPendingTaskIndex(ctx.tasks, completedTaskIndices);
  const contextBlock =
    nextIndex >= 0
      ? `\n\n## Contexte Mon plan (pour lier ta réponse si utile — ne pas imposer l'exercice)
- Jour ${ctx.dayInMonth} : ${ctx.title}
- Action en cours : ${ctx.tasks[nextIndex]}`
      : `\n\n## Contexte Mon plan
- Jour ${ctx.dayInMonth} : ${ctx.title} (terminé)`;

  return `${ROADMAP_COACH_QUESTION_PROMPT}

${buildContextualToolsPromptReference(ctx.businessId ?? profile?.topBusinessId)}${contextBlock}${businessBlock}${memoryBlock}`;
}

export function buildRoadmapCoachFullSystemPrompt(
  profile: QuizProfileSnapshot | null | undefined,
  ctx: RoadmapCoachContext,
  memory?: CoachMemoryContext | null,
  notepadSnippet?: string,
  completedTaskIndices: number[] = []
): string {
  const memoryBlock = buildRoadmapMemorySnippet(memory);
  const notepad = truncateNotepadForPrompt(notepadSnippet);
  const notepadBlock = notepad
    ? `\n\n## Bloc-notes du client\n${notepad}\nUtilise si pertinent pour le jour discuté.`
    : '';

  const businessBlock = (() => {
    const businessId =
      ctx.businessId ??
      (profile?.topBusinessId as BusinessId | undefined);

    if (businessId && businessProfiles[businessId]) {
      const biz = businessProfiles[businessId];
      const languageBlock = profile
        ? getCoachLanguageBlock(resolveCopyTier(profile.entrepreneurialLevel))
        : '';
      const expertBlock = buildBusinessCoachExpertBlock(businessId, {
        phaseId: ctx.phaseId,
        techLevel: profile?.techLevel,
        compact: true,
      });

      return `
${languageBlock}

## Profil client
- Modèle : ${ctx.businessName ?? profile?.topBusinessName ?? biz.name}
- Personnalité : ${profile?.personalityLabel ?? '—'}
- Niveau : ${profile?.entrepreneurialLevel ?? 'Non renseigné'}
- Budget : ${profile?.investmentLevel ?? 'Non renseigné'}
- Tech : ${profile?.techLevel ?? 'Non renseigné'}
- Marché type : ${biz.examples}
- Forces : ${biz.strengths.join('. ')}
- Défis : ${biz.challenges.join('. ')}

${expertBlock}`;
    }

    if (ctx.businessName) {
      return `\n## Modèle business\n- ${ctx.businessName}`;
    }
    return '';
  })();

  return `${ROADMAP_COACH_MODE_PROMPT}

${buildContextualToolsPromptReference(ctx.businessId ?? profile?.topBusinessId)}

## Jour du parcours en discussion
${buildRoadmapCoachSystemBlock(ctx, completedTaskIndices)}${businessBlock}${memoryBlock}${notepadBlock}`;
}

function parseRoadmapTasks(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((task): task is string => typeof task === 'string' && task.trim().length > 0)
    .map((task) => task.trim());
}

export function parseRoadmapCoachContext(raw: unknown): RoadmapCoachContext | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Partial<RoadmapCoachContext>;
  if (typeof c.day !== 'number' || typeof c.title !== 'string' || !c.title.trim()) {
    return null;
  }
  return {
    day: c.day,
    dayInMonth: typeof c.dayInMonth === 'number' ? c.dayInMonth : c.day,
    month: typeof c.month === 'number' ? c.month : 1,
    title: c.title.trim(),
    objective: typeof c.objective === 'string' ? c.objective : '',
    tasks: parseRoadmapTasks(c.tasks),
    tip: typeof c.tip === 'string' && c.tip.trim() ? c.tip.trim() : undefined,
    businessName:
      typeof c.businessName === 'string' && c.businessName.trim()
        ? c.businessName.trim()
        : undefined,
    businessId:
      typeof c.businessId === 'string' &&
      ['saas', 'freelance', 'ecommerce', 'agency', 'marketplace', 'impact', 'consulting', 'content', 'ofm'].includes(
        c.businessId
      )
        ? (c.businessId as BusinessId)
        : undefined,
    phaseId: typeof c.phaseId === 'number' ? c.phaseId : undefined,
    phaseName: typeof c.phaseName === 'string' ? c.phaseName : undefined,
  };
}
