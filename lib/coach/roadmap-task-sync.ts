import {
  getRoadmapDayTaskIndices,
  toggleRoadmapTask,
  type RoadmapProgress,
} from '@/lib/account/roadmap-storage';
import type { RoadmapCoachContext } from '@/lib/coach/roadmap-coach-context';
import type { BusinessId } from '@/lib/quiz/data';

/** Format unique affiché par le coach et lu par Mon plan. */
export const COACH_ACTION_VALIDATION_LINE =
  '✅ Action {n} validée : {summary}';

const COACH_VALIDATION_PATTERNS = [
  /✅\s*action\s*(\d+)\s*(?:du\s+jour\s*)?(?:validee|valid[eé]e|terminee|termin[eé]e|completee|compl[eé]t[eé]e)\b/gi,
  /\baction\s*(\d+)\s*(?:du\s+jour\s*)?(?:validee|valid[eé]e)\b/gi,
];

const MAX_INFERRED_PER_MESSAGE = 3;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function formatCoachActionValidationLine(actionNumber: number, summary: string): string {
  return COACH_ACTION_VALIDATION_LINE.replace('{n}', String(actionNumber)).replace(
    '{summary}',
    summary.trim()
  );
}

function summarizeTaskForValidation(task: string): string {
  const trimmed = task.trim();
  if (trimmed.length <= 52) return trimmed;
  return `${trimmed.slice(0, 49)}…`;
}

/** Extrait tous les numéros d'actions validées dans la réponse du coach (format unique). */
export function parseCoachValidatedActionIndices(reply: string): number[] {
  const normalized = normalizeText(reply);
  const indices = new Set<number>();

  for (const pattern of COACH_VALIDATION_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalized)) !== null) {
      const index = Number.parseInt(match[1], 10) - 1;
      if (Number.isFinite(index) && index >= 0) {
        indices.add(index);
      }
    }
  }

  return [...indices].sort((a, b) => a - b);
}

function countListItems(text: string): number {
  const bullets = (text.match(/(?:^|\n)\s*(?:[-*•]|\d+[.)])\s+/g) || []).length;
  const numbered = (text.match(/\b[1-3][.)]\s+/g) || []).length;
  return Math.max(bullets, numbered);
}

/** Détecte si le message utilisateur contient le livrable d'une action du jour. */
function userMessageMatchesTask(task: string, userMessage: string, reply: string): boolean {
  const user = normalizeText(userMessage);
  const coach = normalizeText(reply);
  const taskNorm = normalizeText(task);
  const combined = `${user}\n${coach}`;

  if (!user.trim()) return false;

  if (/mon client galere|redige.*mon client|redigez.*mon client/i.test(taskNorm)) {
    return /mon client galere|galere parce que|client galle|client galere parce/i.test(user);
  }

  if (/b2b|b2c|entreprise.*particulier|particulier.*entreprise/i.test(taskNorm)) {
    return (
      /\bb2b\b|\bb2c\b|business to business|business to consumer|plutot une entreprise|plutot un particulier|vers les entreprises|vers les particuliers|cible entreprise|cible particulier/i.test(
        user
      )
    );
  }

  if (/3 frustrations|frustrations concretes/i.test(taskNorm)) {
    const mentions = (user.match(/frustration|probleme|galere|douleur|pain point|bloque/g) || [])
      .length;
    return countListItems(user) >= 3 || mentions >= 3;
  }

  if (/frequent et payant|frequence.*payant|probleme est payant/i.test(taskNorm)) {
    return /payant|marche|budget|douleur forte|frequence|demande|pret a payer|clients paier|assez de gens/i.test(
      combined
    );
  }

  if (/apres mon offre/i.test(taskNorm)) {
    return /apres mon offre|mon client peut|mon client va|mon client sera|resultat promis/i.test(user);
  }

  if (/3 benefices|benefices mesurables/i.test(taskNorm)) {
    const mentions = (user.match(/benefice|temps|argent|serenite|gain|economise|revenu/g) || [])
      .length;
    return countListItems(user) >= 3 || mentions >= 3;
  }

  if (/persona/i.test(taskNorm) && /nomme ton persona/i.test(taskNorm)) {
    return /persona|s'appelle|ans.*metier|quotidien|profil type|client ideal/i.test(user);
  }

  if (/objections avant d'acheter|objections/i.test(taskNorm)) {
    return /objection|trop cher|pas le temps|pas besoin|doute|frein/i.test(user);
  }

  if (/declencheur/i.test(taskNorm)) {
    return /declencheur|urgence|maintenant|moment ou|decide d'acheter/i.test(user);
  }

  if (/segment precis|hypothese de marche/i.test(taskNorm)) {
    return /segment|niche|cible|secteur|geographie|marche prioritaire/i.test(user);
  }

  if (/nomme ton offre|structure l'offre/i.test(taskNorm)) {
    return /mon offre|nom de l'offre|forfait|pack|abonnement|formule/i.test(user);
  }

  if (/pitch|accroche hero|proposition de valeur/i.test(taskNorm)) {
    return /pitch|accroche|hero|proposition de valeur|en une phrase/i.test(user);
  }

  if (/prix|pricing|formules nommees/i.test(taskNorm)) {
    return /\d+\s*€|euros|prix|tarif|forfait.*\d|mensuel|annuel/i.test(user);
  }

  const keywords = taskNorm
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 4 && !['action', 'liste', 'note', 'verifie', 'definis'].includes(word));
  if (keywords.length === 0) return false;

  const hits = keywords.filter((word) => user.includes(word)).length;
  return hits >= Math.max(2, Math.ceil(keywords.length * 0.45));
}

function inferFromUserDeliverables(input: RoadmapTaskSyncInput): number[] {
  const { userMessage, reply, tasks, alreadyDone } = input;
  if (!userMessage?.trim() || !tasks.length) return [];

  const inferred: number[] = [];
  for (let index = 0; index < tasks.length; index++) {
    if (alreadyDone.includes(index)) continue;
    if (userMessageMatchesTask(tasks[index], userMessage, reply)) {
      inferred.push(index);
      if (inferred.length >= MAX_INFERRED_PER_MESSAGE) break;
    }
  }
  return inferred;
}

export interface RoadmapTaskSyncInput {
  reply: string;
  tasks: string[];
  alreadyDone: number[];
  userMessage?: string;
}

/**
 * Actions cochées si :
 * 1) le coach écrit « ✅ Action N validée : … », ou
 * 2) le client a déjà fourni le livrable dans son message (mode plan).
 */
export function inferCompletedTaskIndices(input: RoadmapTaskSyncInput): number[] {
  const { reply, tasks, alreadyDone } = input;
  if (!tasks.length) return [];

  const explicit = parseCoachValidatedActionIndices(reply).filter(
    (index) => index < tasks.length && !alreadyDone.includes(index)
  );

  const inferred = inferFromUserDeliverables(input).filter(
    (index) => !explicit.includes(index) && !alreadyDone.includes(index)
  );

  return [...explicit, ...inferred].sort((a, b) => a - b);
}

/** Ajoute les lignes de validation manquantes quand le livrable est détecté dans le message client. */
export function appendInferredCoachValidations(
  reply: string,
  userMessage: string,
  tasks: string[],
  alreadyDone: number[]
): string {
  const explicit = new Set(parseCoachValidatedActionIndices(reply));
  const inferred = inferFromUserDeliverables({ reply, tasks, alreadyDone, userMessage }).filter(
    (index) => !explicit.has(index)
  );

  if (!inferred.length) return reply;

  const lines = inferred.map((index) =>
    formatCoachActionValidationLine(index + 1, summarizeTaskForValidation(tasks[index]))
  );

  return `${reply.trim()}\n\n${lines.join('\n')}`;
}

export function buildRoadmapTasksProgressBlock(
  ctx: RoadmapCoachContext,
  completedIndices: number[]
): string {
  if (!ctx.tasks.length) return '';

  const doneSet = new Set(completedIndices);
  const nextIndex = ctx.tasks.findIndex((_, index) => !doneSet.has(index));
  const lines = ctx.tasks.map((task, index) => {
    const status = doneSet.has(index) ? '[✓]' : '[ ]';
    const marker = index === nextIndex ? ' ← ACTION EN COURS' : '';
    return `  ${status} Action ${index + 1} : ${task}${marker}`;
  });

  const validationExample =
    nextIndex >= 0
      ? formatCoachActionValidationLine(nextIndex + 1, 'résumé court de ce qui a été fait')
      : '';

  const nextLine =
    nextIndex >= 0
      ? `\n**Validation Mon plan (format OBLIGATOIRE)** :
- Si le client a DÉJÀ fourni un livrable dans son message (phrase, choix B2B/B2C, liste…), ne le fais pas recommencer : valide avec « ✅ Action N validée : … ».
- Sinon, quand tu l'aides à terminer l'Action ${nextIndex + 1}, termine par exactement :
« ${validationExample} »
Sans cette ligne, Mon plan ne sera pas mis à jour. Jusqu'à 3 actions par message si le client les a déjà faites.`
      : '\n**Toutes les actions du jour sont cochées.** Félicite brièvement et propose le jour suivant.';

  return `## Progression actions du jour (synchronisée avec Mon plan)
${lines.join('\n')}${nextLine}`;
}

export interface CoachRoadmapTaskSyncResult {
  day: number;
  newlyCompleted: number[];
  tasksDone: number;
  tasksTotal: number;
  dayCompleted: boolean;
  progress: RoadmapProgress;
}

export function applyCoachRoadmapTaskSync(
  businessId: BusinessId,
  ctx: RoadmapCoachContext,
  reply: string,
  progress?: RoadmapProgress | null,
  userMessage?: string
): CoachRoadmapTaskSyncResult | null {
  const totalTasks = ctx.tasks.length;
  if (!totalTasks) return null;

  const alreadyDone = getRoadmapDayTaskIndices(progress ?? null, ctx.day, totalTasks);
  const newlyCompleted = inferCompletedTaskIndices({
    reply,
    tasks: ctx.tasks,
    alreadyDone,
    userMessage,
  });

  if (!newlyCompleted.length && !progress) return null;

  let currentProgress = progress ?? null;
  for (const taskIndex of newlyCompleted) {
    currentProgress = toggleRoadmapTask(businessId, ctx.day, taskIndex, totalTasks, true);
  }

  if (!currentProgress) return null;

  const tasksDone = getRoadmapDayTaskIndices(currentProgress, ctx.day, totalTasks).length;

  return {
    day: ctx.day,
    newlyCompleted,
    tasksDone,
    tasksTotal: totalTasks,
    dayCompleted: tasksDone >= totalTasks,
    progress: currentProgress,
  };
}

export function formatRoadmapTaskSyncNotice(result: CoachRoadmapTaskSyncResult): string | null {
  if (!result.newlyCompleted.length) return null;

  const lines = result.newlyCompleted.map(
    (index) => `✅ Action ${index + 1} validée dans Mon plan`
  );

  if (result.dayCompleted) {
    return `${lines.join(' · ')} — jour terminé !`;
  }

  return `${lines.join(' · ')} (${result.tasksDone}/${result.tasksTotal})`;
}
