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

/** Messages de navigation — ne doivent jamais cocher Mon plan. */
const COACH_NAV_MESSAGE_PATTERNS = [
  /\bon\s+(re)?prend(re|ons)\s+(mon\s+)?plan\b/i,
  /\bcontinu(e|ons)\b/i,
  /\bo[uù]\s*j['']?en\s+suis\b/i,
  /\bprochaine\s*(micro[- ]?)?[eé]tape\b/i,
  /\bpriorit[eé]\s+du\s+jour\b/i,
  /\breprend(s|re)?\s+le\s+fil\b/i,
  /\bquelle\s+est\s+la\s+prochaine\b/i,
  /\b[oé]tat\s+du\s+parcours\b/i,
];

export function isCoachNavigationMessage(userMessage: string | undefined): boolean {
  const user = userMessage?.trim() ?? '';
  if (!user) return true;
  if (user.length > 160) return false;
  return COACH_NAV_MESSAGE_PATTERNS.some((pattern) => pattern.test(user));
}

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
function userMessageMatchesTask(task: string, userMessage: string): boolean {
  const user = normalizeText(userMessage);
  const taskNorm = normalizeText(task);

  if (!user.trim()) return false;

  if (/^(comment|pourquoi|qu['']est|c['']est quoi|explique|aide[- ]moi)\b/i.test(userMessage.trim())) {
    if (!/\bmon client galere|mon offre|b2b|b2c|\d+\s*€|persona|frustration/i.test(user)) {
      return false;
    }
  }

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
      user
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

/** Le client a fourni le livrable attendu pour cette action (pas seulement posé une question). */
export function userMessageFulfillsTask(task: string, userMessage: string | undefined): boolean {
  if (!userMessage?.trim() || isCoachNavigationMessage(userMessage)) return false;
  return userMessageMatchesTask(task, userMessage);
}


export interface RoadmapTaskSyncInput {
  reply: string;
  tasks: string[];
  alreadyDone: number[];
  userMessage?: string;
}

/**
 * Actions cochées uniquement si :
 * 1) le coach écrit « ✅ Action N validée : … », ET
 * 2) le message client contient le livrable de cette action (pas un simple « continuer »).
 */
export function inferCompletedTaskIndices(input: RoadmapTaskSyncInput): number[] {
  const { reply, tasks, alreadyDone, userMessage } = input;
  if (!tasks.length || !userMessage?.trim() || isCoachNavigationMessage(userMessage)) {
    return [];
  }

  return parseCoachValidatedActionIndices(reply)
    .filter(
      (index) =>
        index < tasks.length &&
        !alreadyDone.includes(index) &&
        userMessageFulfillsTask(tasks[index], userMessage)
    )
    .sort((a, b) => a - b);
}

/** Conservé pour compatibilité — n'ajoute plus de validations automatiques. */
export function appendInferredCoachValidations(
  reply: string,
  _userMessage: string,
  _tasks: string[],
  _alreadyDone: number[]
): string {
  return reply;
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
- Ne valide **jamais** sur un simple « continuer », « reprendre mon plan » ou une question sans livrable.
- Guide d'abord l'Action ${nextIndex + 1}, demande au client de **faire l'exercice et coller sa réponse**.
- Quand (et seulement quand) le client a fourni son livrable dans son message, termine par exactement :
« ${validationExample} »
Sans cette ligne + livrable client, Mon plan ne sera pas mis à jour. Une action à la fois sauf si le client envoie plusieurs livrables distincts.`
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
