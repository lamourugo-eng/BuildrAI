import { COACH_CONCISENESS_PROMPT, COACH_LENGTH_QUESTION } from '@/lib/coach/concise-style';
import { buildContextualToolsPromptReference } from '@/lib/coach/contextual-tools';
import { buildBusinessCoachExpertBlock } from '@/lib/coach/business-coach-context';
import {
  buildRoadmapTasksProgressBlock,
} from '@/lib/coach/roadmap-task-sync';
import { buildRoadmapMemorySnippet, truncateNotepadForPrompt } from '@/lib/coach/prompt-memory';
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

export const ROADMAP_COACH_MODE_PROMPT = `Tu es BuildrAI Coach. Mode **Parcours premium (${TOTAL_ROADMAP_DAYS} jours)**.

## Mission
L'utilisateur discute d'un **jour précis** du parcours, ou pose une **question business** (même hors sujet du jour). Tu réponds à **n'importe quelle question** orientée entrepreneuriat :
- comment réaliser une action, clarification, exemple concret, texte prêt à copier-coller ;
- Adaptation à son modèle business, budget et niveau tech ;
- **OnlyFans Management (OFM)** : modèles OnlyFans, chatting, acquisition abonnés, commission sur revenus plateforme, charte éthique. Jamais de promesses de revenus garantis ;
- **forme juridique** (micro, SASU, EURL…) **uniquement en mois 1** : aider à anticiper le statut cible, sans pousser à immatriculer. Conseiller de formaliser une fois le business monté (clients, CA) ;
- déblocage, priorisation, erreurs fréquentes, alternatives ;
- lien avec l'étape coach 8 phases **uniquement** si ça aide ce jour (sans imposer le plan général).

## Règles
- Réponds **directement** à la question posée (pas de message d'accueil, pas de reprise de la dernière micro-étape mémorisée).
- Appuie-toi sur le titre, l'objectif, les actions et le conseil du jour. Enrichis avec ton expertise **spécifique au modèle business** du client (métriques, canaux, pricing typiques).
- Structure libre (titres courts, listes, exemples). **Interdit** d'imposer le format rigide SITUATION / PARCOURS 8 étapes / PLAN numéroté coach sauf demande explicite du client.
- Sois actionnable : checklists, scripts, décisions, outils nommés (avec URL si pertinent).
- **Outils précis obligatoires** : Reddit (+ subreddit), Typeform, Cal.com, Stripe… Jamais « cherche sur des forums » sans nommer Reddit ou Indie Hackers.
- **Synchronisation Mon plan (format unique)** : pour cocher une action dans Mon plan, termine par une ligne exacte :
  « ✅ Action N validée : [résumé court] » (N = numéro).
  **Uniquement** si le client a **envoyé son livrable** dans ce message (texte rédigé, choix B2B/B2C, liste complétée…).
  **Interdit** de valider sur « continuer », « reprendre mon plan », « où j'en suis » ou une simple question.
  **Interdit** de faire l'exercice à sa place puis valider : guide-le, attends sa réponse, puis valide.
  Sans livrable client + cette ligne, Mon plan ne sera pas mis à jour.
- **Interdit** : proposer un « Bloc Focus » ou « 45 minutes sans distractions ». Pas de conseils de gestion du temps génériques.
- Une seule question de clarification si indispensable.
- ${COACH_LENGTH_QUESTION}

${COACH_CONCISENESS_PROMPT}`;

function formatRoadmapDayTasks(tasks: string[]): string {
  if (!tasks.length) return '';
  return tasks.map((task, index) => `${index + 1}. ${task}`).join('\n');
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

export function buildRoadmapCoachWelcome(
  ctx: RoadmapCoachContext,
  businessName: string
): string {
  const phaseLine = ctx.phaseName ? `\nÉtape coach : ${ctx.phaseName}` : '';
  const tasksBlock = ctx.tasks.length
    ? `\n\n**Actions du jour :**\n${formatRoadmapDayTasks(ctx.tasks)}`
    : '';
  const tipLabel = ctx.businessName ?? businessName;
  const tipBlock = ctx.tip ? `\n\n**${tipLabel}**. ${ctx.tip}` : '';

  return `Tu viens du parcours. **jour ${ctx.dayInMonth}** (chapitre mois ${ctx.month}).

**${ctx.title}**
${ctx.objective}${phaseLine}${tasksBlock}${tipBlock}

Pour faire avancer Mon plan, **fais une action du jour puis envoie ta réponse ici** (texte rédigé, choix, liste…). Je t'aide à affiner — je ne coche le plan que quand tu m'as envoyé ton livrable.`;
}

/** Bloc injecté dans le prompt système quand l'utilisateur vient du parcours premium. */
export function buildRoadmapCoachSystemBlock(
  ctx: RoadmapCoachContext,
  completedTaskIndices: number[] = []
): string {
  const phaseLine = ctx.phaseName ? `\n- Phase coach liée : ${ctx.phaseName}` : '';
  const tasksLine = ctx.tasks.length
    ? `\n- Actions du jour (reproduire telles quelles si tu les cites) :\n${formatRoadmapDayTasks(ctx.tasks)}`
    : '';
  const tipLine = ctx.tip ? `\n- Conseil modèle : ${ctx.tip}` : '';
  const progressLine = ctx.tasks.length
    ? `\n\n${buildRoadmapTasksProgressBlock(ctx, completedTaskIndices)}`
    : '';

  return `L'utilisateur pose une question sur le **jour ${ctx.dayInMonth}** du parcours premium (chapitre ${ctx.month}, **jour global ${ctx.day}/${TOTAL_ROADMAP_DAYS}**) :
- Titre : ${ctx.title}
- Objectif : ${ctx.objective}${phaseLine}${tasksLine}${tipLine}${progressLine}

Tu connais l'intégralité du parcours (${TOTAL_ROADMAP_DAYS} jours). Ici, concentre-toi sur **ce jour** et réponds à **toute** question du client (pratique, stratégique, rédaction, outil, priorisation, juridique, revente) sans renvoyer vers un plan coach générique ni répéter un message de session précédente.`;
}

/** Consigne interne ajoutée au message utilisateur côté API. */
export function buildRoadmapCoachReminder(
  ctx: RoadmapCoachContext,
  completedTaskIndices: number[] = []
): string {
  const tasksHint = ctx.tasks.length
    ? ` Actions du jour : ${ctx.tasks.join('. ')}.`
    : '';
  const nextIndex = ctx.tasks.findIndex((_, index) => !completedTaskIndices.includes(index));
  const focusHint =
    nextIndex >= 0
      ? ` Priorise Action ${nextIndex + 1}. Ne valide que si le client a collé son livrable dans CE message (pas sur « continuer » / « reprendre »). Sinon : explique l'exercice et demande sa réponse — sans ligne « ✅ Action N validée ».`
      : ' Toutes les actions du jour sont déjà cochées.';
  return `[Consigne interne. Parcours jour ${ctx.day}/${TOTAL_ROADMAP_DAYS}] « ${ctx.title} ».${tasksHint}${focusHint} Réponse dense, 100–280 mots. Pas de format 8 étapes. Pas de remplissage.`;
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
