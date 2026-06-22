import {
  getRoadmapDayTaskIndices,
  toggleRoadmapTask,
  saveRoadmapProgress,
  type RoadmapProgress,
} from '@/lib/account/roadmap-storage';
import type { RoadmapCoachContext } from '@/lib/coach/roadmap-coach-context';
import {
  isDefinitionalQuestion,
} from '@/lib/coach/interaction-mode';
import {
  businessUsesMarketSegment,
  detectMarketSegmentFromText,
} from '@/lib/quiz/market-segment';
import type { BusinessId } from '@/lib/quiz/data';

/** Format unique affiché par le coach et lu par Mon plan. */
export const COACH_ACTION_VALIDATION_LINE =
  '✅ Action {n} validée : {summary}';

const COACH_VALIDATION_PATTERNS = [
  /✅\s*action\s*(\d+)\s*(?:du\s+jour\s*)?(?:validee|valid[eé]e|terminee|termin[eé]e|completee|compl[eé]t[eé]e)\b/gi,
  /\baction\s*(\d+)\s*(?:du\s+jour\s*)?(?:validee|valid[eé]e)\b/gi,
];

/** Le coach refuse explicitement le livrable (sinon on peut avancer). */
function coachExplicitlyRejectsDeliverable(reply: string): boolean {
  const n = normalizeText(reply);
  return /pas encore|incomplet|il manque|pas assez|reformule|reessaie|pas valide|ne valide pas|trop court|insuffisant|precise davantage|peux-tu (?:preciser|completer|developper)|ce n'est pas suffisant|pas tout a fait/i.test(
    n
  );
}

function userLikelySubmittedDeliverable(userMessage: string): boolean {
  const text = userMessage.trim();
  if (text.length < 22) return false;
  if (isDefinitionalQuestion(text)) return false;
  if (isCoachNavigationMessage(text)) return false;
  if (text.length < 100 && /\?\s*$/.test(text) && !/(?:^|\n)\s*(?:[-*•]|\d+[.)])/m.test(text)) {
    return false;
  }
  return true;
}

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

/** Index de la prochaine action non validée, ou -1 si le jour est terminé. */
export function getNextPendingTaskIndex(tasks: string[], completedIndices: number[]): number {
  return tasks.findIndex((_, index) => !completedIndices.includes(index));
}

export type CoachActionPresentationVariant = 'intro' | 'resume' | 'next';

export interface CoachActionPresentationOptions {
  variant?: CoachActionPresentationVariant;
}

function truncateTaskLabel(task: string, max = 48): string {
  const trimmed = task.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/** Ligne compacte : jour + titre + progression Mon plan. */
export function buildRoadmapProgressHeader(
  ctx: RoadmapCoachContext,
  completedIndices: number[]
): string {
  const total = ctx.tasks.length;
  const done = completedIndices.length;
  const phaseLine = ctx.phaseName ? ` · _${ctx.phaseName}_` : '';
  return `**Jour ${ctx.dayInMonth}** — ${ctx.title}${phaseLine} · **${done}/${total}** validée${done > 1 ? 's' : ''}`;
}

/** Récap des actions déjà cochées dans Mon plan (évite l'effet « retour à zéro »). */
export function buildRoadmapCompletedRecap(
  ctx: RoadmapCoachContext,
  completedIndices: number[]
): string {
  if (!completedIndices.length) return '';

  return [...completedIndices]
    .sort((a, b) => a - b)
    .map((index) => `✅ Action ${index + 1} — ${truncateTaskLabel(ctx.tasks[index])}`)
    .join('\n');
}

function resolveActionPresentationVariant(
  taskIndex: number,
  completedCount: number,
  explicit?: CoachActionPresentationVariant
): CoachActionPresentationVariant {
  if (explicit) return explicit;
  if (completedCount > 0) return 'resume';
  if (taskIndex === 0) return 'intro';
  return 'next';
}

function buildActionPresentationFooter(variant: CoachActionPresentationVariant): string {
  switch (variant) {
    case 'intro':
      return 'Fais l\'exercice puis **envoie ta réponse ici**. Dès que c\'est bon, je valide dans Mon plan et on passe à la suite.';
    case 'resume':
      return '**Envoie ta réponse** pour l\'action en cours — je valide dans Mon plan et on enchaîne.';
    case 'next':
      return 'À toi — **envoie ton livrable** quand c\'est prêt.';
  }
}

/** Message coach pour présenter une action (une à la fois). */
export function buildCoachNextActionPresentation(
  ctx: RoadmapCoachContext,
  taskIndex: number,
  completedCount = 0,
  options?: CoachActionPresentationOptions
): string {
  const task = ctx.tasks[taskIndex];
  const total = ctx.tasks.length;
  const variant = resolveActionPresentationVariant(taskIndex, completedCount, options?.variant);
  const tipLine = ctx.tip && taskIndex === 0 && variant === 'intro' ? `\n\n💡 ${ctx.tip}` : '';
  const footer = buildActionPresentationFooter(variant);

  return `### Action ${taskIndex + 1}/${total}

${task}${tipLine}

${footer}`;
}

/** Accueil reprise quand le client revient sur un jour déjà entamé. */
export function buildRoadmapCoachResumeWelcome(
  ctx: RoadmapCoachContext,
  completedIndices: number[]
): string {
  const nextIndex = getNextPendingTaskIndex(ctx.tasks, completedIndices);

  if (nextIndex < 0) {
    return `Content de te revoir !

${buildCoachDayCompletedMessage(ctx)}`;
  }

  const header = buildRoadmapProgressHeader(ctx, completedIndices);
  const recap = buildRoadmapCompletedRecap(ctx, completedIndices);
  const nextPreview = truncateTaskLabel(ctx.tasks[nextIndex], 72);

  return `Content de te revoir ! On reprend **là où tu t'étais arrêté**.

${header}${recap ? `\n\n${recap}` : ''}

➡️ **Prochaine action** : ${nextPreview}

Clique « Reprendre mon plan » ou envoie directement ton livrable.`;
}

/** Message quand toutes les actions du jour sont validées. */
export function buildCoachDayCompletedMessage(ctx: RoadmapCoachContext): string {
  return `🎉 **Jour ${ctx.dayInMonth} terminé !** Toutes les actions sont validées dans Mon plan.

Tu peux revenir à **Mon plan** pour le jour suivant, ou me poser une question libre.`;
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

/** Pipeline unique : validation Mon plan + enchaînement action suivante. */
export function processRoadmapCoachReply(
  reply: string,
  ctx: RoadmapCoachContext,
  completedIndices: number[],
  userMessage?: string
): string {
  if (!userMessage?.trim() || isCoachNavigationMessage(userMessage)) {
    return sanitizeSequentialCoachReply(reply, ctx);
  }

  let processed = ensureCoachValidationLine(reply, ctx, completedIndices, userMessage);
  processed = appendNextActionIfValidated(processed, ctx, completedIndices, userMessage);
  return sanitizeSequentialCoachReply(processed, ctx);
}

/** Retire les répétitions de contexte jour quand une action est déjà présentée. */
export function sanitizeSequentialCoachReply(reply: string, ctx: RoadmapCoachContext): string {
  if (!/###\s*Action\s+\d+/i.test(reply)) return reply.trim();

  let text = reply.trim();
  const dayHeader = new RegExp(
    `\\*\\*Jour\\s+${ctx.dayInMonth}\\*\\*[\\s\\S]*?On avance \\*\\*une action à la fois\\*\\*[\\s\\S]*?Voici la suivante\\s*:\\s*\\n+`,
    'i'
  );
  text = text.replace(dayHeader, '');
  text = text.replace(
    /Tu viens du parcours\.[\s\S]*?Voici la suivante\s*:\s*\n+/i,
    ''
  );
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

/** Ajoute la ligne ✅ si le client a livré l'action en cours mais le coach a oublié le format. */
export function ensureCoachValidationLine(
  reply: string,
  ctx: RoadmapCoachContext,
  completedIndices: number[],
  userMessage?: string
): string {
  if (!userMessage?.trim() || isCoachNavigationMessage(userMessage)) return reply;

  const currentIndex = getNextPendingTaskIndex(ctx.tasks, completedIndices);
  if (currentIndex < 0) return reply;
  if (!userMessageFulfillsTask(ctx.tasks[currentIndex], userMessage)) return reply;
  if (coachExplicitlyRejectsDeliverable(reply)) return reply;
  if (parseCoachValidatedActionIndices(reply).includes(currentIndex)) return reply;

  return `${reply.trim()}\n\n${formatCoachActionValidationLine(
    currentIndex + 1,
    summarizeTaskForValidation(ctx.tasks[currentIndex])
  )}`;
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
  if (isDefinitionalQuestion(userMessage)) return false;

  const user = normalizeText(userMessage);
  const taskNorm = normalizeText(task);

  if (!user.trim()) return false;

  if (/mon client galere|redige.*mon client|redigez.*mon client/i.test(taskNorm)) {
    return /mon client galere|galere parce que|client galle|client galere parce/i.test(user);
  }

  if (/b2b|b2c|entreprise.*particulier|particulier.*entreprise|plutot une entreprise|plutot un particulier/i.test(taskNorm)) {
    return (
      /\bb2b\b|\bb2c\b|business to business|business to consumer|plutot.*entreprise|plutot.*particulier|vers les entreprises|vers les particuliers|cible.*entreprise|cible.*particulier|je vise.*entreprise|je vise.*particulier|pour les entreprises|pour les particuliers|des entreprises|aux entreprises|aux particuliers|marketplace b2b|marketplace b2c/i.test(
        user
      ) ||
      (/\bentreprise/i.test(user) && !/\bparticulier/i.test(user)) ||
      (/\bparticulier/i.test(user) && !/\bentreprise/i.test(user))
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

  if (/audit du premier mois|liste tout ce que tu as lance/i.test(taskNorm)) {
    return /lance|landing|essai|demo|client|vente|contact|pub|commande|mrr|pipeline/i.test(user);
  }

  if (/ce qui a converti|canal.*message.*gagnant/i.test(taskNorm)) {
    return /converti|conversion|canal|script|message|reponse positive|rdv|vente/i.test(user);
  }

  if (/ce qui a bloque|freins principaux/i.test(taskNorm)) {
    return /bloque|frein|peur|temps|technique|objection|probleme/i.test(user);
  }

  if (/compare|difference|alternative|solution existante/i.test(taskNorm)) {
    return /compare|difference|concurrent|alternative|versus|\bvs\b|plutot|differencie/i.test(user);
  }

  if (/ecris|redige|note |liste |definis|decris/i.test(taskNorm)) {
    return user.length >= 20;
  }

  const keywords = taskNorm
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 4 && !['action', 'liste', 'note', 'verifie', 'definis'].includes(word));
  if (keywords.length > 0) {
    const hits = keywords.filter((word) => user.includes(word)).length;
    if (hits >= Math.max(2, Math.ceil(keywords.length * 0.35))) return true;
  }

  return userLikelySubmittedDeliverable(userMessage);
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
 * 1) le coach écrit « ✅ Action N validée : … » pour l'action EN COURS,
 * 2) le message client contient le livrable de cette action,
 * 3) une seule action par échange (séquentiel).
 */
export function inferCompletedTaskIndices(input: RoadmapTaskSyncInput): number[] {
  const { reply, tasks, alreadyDone, userMessage } = input;
  if (!tasks.length || !userMessage?.trim() || isCoachNavigationMessage(userMessage)) {
    return [];
  }

  const currentIndex = getNextPendingTaskIndex(tasks, alreadyDone);
  if (currentIndex < 0) return [];

  const validated = parseCoachValidatedActionIndices(reply).filter(
    (index) =>
      index === currentIndex &&
      index < tasks.length &&
      userMessageFulfillsTask(tasks[index], userMessage)
  );

  return validated.length ? [currentIndex] : [];
}

/** Ajoute la présentation de l'action suivante après validation de l'action EN COURS. */
export function appendNextActionIfValidated(
  reply: string,
  ctx: RoadmapCoachContext,
  completedIndices: number[],
  userMessage?: string
): string {
  if (!userMessage?.trim() || isCoachNavigationMessage(userMessage)) return reply;

  const currentIndex = getNextPendingTaskIndex(ctx.tasks, completedIndices);
  if (currentIndex < 0) return reply;
  if (!userMessageFulfillsTask(ctx.tasks[currentIndex], userMessage)) return reply;

  const withValidation = parseCoachValidatedActionIndices(reply).includes(currentIndex)
    ? reply
    : ensureCoachValidationLine(reply, ctx, completedIndices, userMessage);

  if (!parseCoachValidatedActionIndices(withValidation).includes(currentIndex)) {
    return reply;
  }

  const updatedDone = [...completedIndices, currentIndex];
  const nextIndex = getNextPendingTaskIndex(ctx.tasks, updatedDone);
  if (nextIndex < 0) {
    if (/jour\s+\d+\s+termin/i.test(withValidation)) return withValidation;
    return `${withValidation.trim()}\n\n${buildCoachDayCompletedMessage(ctx)}`;
  }

  const nextActionNum = nextIndex + 1;
  if (coachAlreadyPresentedAction(withValidation, nextActionNum)) return withValidation;

  const nextTaskSnippet = ctx.tasks[nextIndex].slice(0, 40);
  if (withValidation.includes(nextTaskSnippet)) return withValidation;

  return `${withValidation.trim()}\n\n${buildCoachNextActionPresentation(ctx, nextIndex, updatedDone.length, {
    variant: 'next',
  })}`;
}

function coachAlreadyPresentedAction(reply: string, actionNumber: number): boolean {
  return new RegExp(`###\\s*Action\\s+${actionNumber}(?:\\/|\\s)`, 'i').test(reply);
}

/** @deprecated Utiliser processRoadmapCoachReply */
export function appendInferredCoachValidations(
  reply: string,
  userMessage: string,
  tasks: string[],
  alreadyDone: number[]
): string {
  const ctx = { tasks } as RoadmapCoachContext;
  return processRoadmapCoachReply(reply, ctx, alreadyDone, userMessage);
}

export function buildRoadmapTasksProgressBlock(
  ctx: RoadmapCoachContext,
  completedIndices: number[]
): string {
  if (!ctx.tasks.length) return '';

  const total = ctx.tasks.length;
  const doneCount = completedIndices.length;
  const nextIndex = getNextPendingTaskIndex(ctx.tasks, completedIndices);

  if (nextIndex < 0) {
    return `## Progression Mon plan
${doneCount}/${total} actions validées — **jour terminé**. Félicite brièvement le client.`;
  }

  const validationExample = formatCoachActionValidationLine(
    nextIndex + 1,
    'résumé court de ce qui a été fait'
  );
  const hasNext = nextIndex + 1 < total;
  const nextActionHint = hasNext
    ? `\n- Juste après cette ligne, enchaîne dans le **MÊME** message avec le bloc Action ${nextIndex + 2} (titre ###, texte exact, guide court).`
    : '\n- C\'était la dernière action : félicite sans enchaîner.';
  const doneRecap =
    doneCount > 0
      ? `\n\n**Déjà validées (${doneCount}/${total}) — ne les redemande pas :**\n${buildRoadmapCompletedRecap(ctx, completedIndices)}`
      : '';

  return `## Progression Mon plan (${doneCount}/${total} validées)${doneRecap}

**Action EN COURS (une seule visible pour le client) :**
Action ${nextIndex + 1} : ${ctx.tasks[nextIndex]}

**Mode séquentiel strict :**
- Ne répète **jamais** le titre du jour, l'objectif ou la phase coach (sauf reprise explicite « où j'en suis »).
- Ne liste **jamais** les autres actions du jour ni ne redemande une action déjà validée.
- Ne traite qu'**une** action à la fois.
- Quand le client envoie son livrable pour l'Action ${nextIndex + 1}, termine par exactement :
« ${validationExample} »${nextActionHint}
- Sans livrable client + cette ligne, Mon plan ne sera pas mis à jour.`;
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

  const segment = detectMarketSegmentFromText(userMessage);
  if (segment && businessUsesMarketSegment(businessId)) {
    currentProgress = {
      ...currentProgress,
      marketSegment: segment,
      updatedAt: new Date().toISOString(),
    };
    saveRoadmapProgress(currentProgress);
  }

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

interface CoachExchangeLike {
  role: 'user' | 'assistant';
  content: string;
}

/** Rattrape au plus une action depuis le dernier échange user → coach (pas tout l'historique). */
export function syncAllPendingActionsFromHistory(
  businessId: BusinessId,
  ctx: RoadmapCoachContext,
  exchanges: CoachExchangeLike[],
  progress?: RoadmapProgress | null
): { progress: RoadmapProgress; followUp: string; totalSynced: number } | null {
  const result = trySyncPendingActionFromHistory(
    businessId,
    ctx,
    exchanges,
    progress
  );
  if (!result) return null;

  return {
    progress: result.sync.progress,
    followUp: result.followUp,
    totalSynced: result.sync.newlyCompleted.length,
  };
}

function findLastCoachExchange(
  exchanges: CoachExchangeLike[]
): { user: CoachExchangeLike; assistant: CoachExchangeLike | null } | null {
  for (let i = exchanges.length - 1; i >= 0; i--) {
    const msg = exchanges[i];
    if (msg.role !== 'user' || isCoachNavigationMessage(msg.content)) continue;
    const assistant = exchanges[i + 1]?.role === 'assistant' ? exchanges[i + 1] : null;
    return { user: msg, assistant };
  }
  return null;
}

export function trySyncPendingActionFromHistory(
  businessId: BusinessId,
  ctx: RoadmapCoachContext,
  exchanges: CoachExchangeLike[],
  progress?: RoadmapProgress | null
): { sync: CoachRoadmapTaskSyncResult; followUp: string } | null {
  const totalTasks = ctx.tasks.length;
  if (!totalTasks || !exchanges.length) return null;

  const alreadyDone = getRoadmapDayTaskIndices(progress ?? null, ctx.day, totalTasks);
  const currentIndex = getNextPendingTaskIndex(ctx.tasks, alreadyDone);
  if (currentIndex < 0) return null;

  const lastExchange = findLastCoachExchange(exchanges);
  if (!lastExchange) return null;
  if (!userMessageFulfillsTask(ctx.tasks[currentIndex], lastExchange.user.content)) return null;

  let reply = lastExchange.assistant?.content ?? '';
  if (!reply.trim()) return null;
  if (coachExplicitlyRejectsDeliverable(reply)) return null;

  reply = processRoadmapCoachReply(reply, ctx, alreadyDone, lastExchange.user.content);

  const sync = applyCoachRoadmapTaskSync(
    businessId,
    ctx,
    reply,
    progress?.businessId === businessId ? progress : null,
    lastExchange.user.content
  );

  if (!sync?.newlyCompleted.length) return null;

  const nextIndex = getNextPendingTaskIndex(
    ctx.tasks,
    getRoadmapDayTaskIndices(sync.progress, ctx.day, totalTasks)
  );
  const syncedDone = getRoadmapDayTaskIndices(sync.progress, ctx.day, totalTasks).length;
  const followUp =
    nextIndex >= 0
      ? buildCoachNextActionPresentation(ctx, nextIndex, syncedDone, {
          variant: syncedDone > 0 ? 'resume' : 'intro',
        })
      : buildCoachDayCompletedMessage(ctx);

  return { sync, followUp };
}

export function formatRoadmapTaskSyncNotice(result: CoachRoadmapTaskSyncResult): string | null {
  if (!result.newlyCompleted.length) return null;

  const actionNum = result.newlyCompleted[0] + 1;
  const line = `✅ Action ${actionNum} validée dans Mon plan`;

  if (result.dayCompleted) {
    return `${line} — jour terminé !`;
  }

  return `${line} (${result.tasksDone}/${result.tasksTotal}) — action suivante ci-dessous`;
}
