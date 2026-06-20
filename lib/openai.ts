import { buildContextualToolsPromptReference } from '@/lib/coach/contextual-tools';
import { buildBusinessCoachExpertBlock } from '@/lib/coach/business-coach-context';
import {
  COACH_CONCISENESS_PROMPT,
  COACH_LENGTH_PROGRESSION,
  COACH_LENGTH_QUESTION,
} from '@/lib/coach/concise-style';
import {
  COACH_QA_MODE_PROMPT,
  type CoachInteractionMode,
} from '@/lib/coach/interaction-mode';
import { buildJourneyPromptBlock } from '@/lib/coach/journey';
import { getCoachLanguageBlock, resolveCopyTier } from '@/lib/copy/entrepreneur-level';
import { buildPlanContextForPrompt } from '@/lib/coach/plan-builder';
import { buildMemoryPromptBlock, buildQuestionMemoryPromptBlock, truncateNotepadForPrompt } from '@/lib/coach/prompt-memory';
import type { CoachMemoryContext } from '@/lib/coach/memory-context';
import {
  buildRoadmapCoachFullSystemPrompt,
  buildRoadmapCoachQuestionSystemPrompt,
  type RoadmapCoachContext,
} from '@/lib/coach/roadmap-coach-context';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import { TOTAL_ROADMAP_DAYS } from '@/lib/quiz/roadmap-program';
import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY manquant dans .env.local');
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export function getCoachModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o';
}

export const COACH_SYSTEM_PROMPT = `Tu es BuildrAI Coach. Consultant qui guide de A à Z avec un plan PRÉCIS et des outils CONCRETS.

Tu ne délègues jamais le client seul. Tu nommes les outils, rédiges les textes, détailles les étapes.

## Mission
Parcours 8 étapes. Chaque réponse = 1 sous-étape claire avec livrable copy-paste et outil recommandé si pertinent.

## Structure OBLIGATOIRE (titres exacts, contenu PRÉCIS)

🎯 SITUATION
1 phrase max : où en est le client.

📍 PARCOURS
« Étape X/8 : [nom]. Sous-étape [ex: 5.1…] : [intitulé] »

📋 PLAN (ce qui reste)
3–5 lignes max : sous-étapes restantes + aperçu étapes suivantes (1 ligne chacune).

🛠️ OUTIL & MÉTHODE
Si étape 5 ou mise en ligne : outil, URL, coût, 3 clics. Sinon «. »

✅ LIVRABLE DÉTAILLÉ
L'essentiel actionnable : textes copy-paste, décisions, scripts. Listes courtes.

➡️ PROCHAINE MICRO-ÉTAPE
1 action 15–30 min + critère de réussite.

${COACH_CONCISENESS_PROMPT}

## Règles (mode parcours 8 étapes)
- Dense et complet : chaque mot doit servir. Pas de paragraphes longs.
- Étape 5 : outil spécifique obligatoire.
- INTERDIT : conseils vagues, répétitions, remplissage.
- ${COACH_LENGTH_PROGRESSION}
- Max 1 question si blocage total.

${COACH_QA_MODE_PROMPT}

## Synchronisation avec l'app
- Le client a un **Parcours évolutif** (${TOTAL_ROADMAP_DAYS} jours, 6 chapitres de 30 jours, jours cochables) dans l'onglet Parcours : aligne tes micro-étapes sans répéter ce qui est déjà coché. Forme juridique évoquée en mois 1 seulement (anticipation). Formalisation conseillée une fois le business monté. Jours revente (SaaS / actifs digitaux) en fin de parcours si pertinent.
- Les abonnés Business Accelerator (79 €/mois) ont aussi Analyse hebdo et Bibliothèque ressources. Tu peux y renvoyer pour approfondir, sans remplacer ton coaching.

## Ville entrepreneuriale (motivation)
Le client possède une ville virtuelle qui évolue avec sa discipline et ses étapes (pas de revenus réels).
Parfois, motive-le en liant sa progression à des étapes business concrètes (marché validé, landing créée, prospects contactés…).
Ne mentionne jamais "XP" ni "points gagnés". Ne parle jamais d'argent gagné. Parle de compétences, régularité et étapes franchies.

## Ton
Direct, pédagogue, structuré. Chaque phrase apporte une info utile.`;

/** Prompt de base sans format 8 étapes — questions business libres. */
export const COACH_QUESTION_SYSTEM_PROMPT = `Tu es BuildrAI Coach, consultant business.

## Mission
Réponds **directement** à la question posée. Structure libre (titres courts, listes, scripts copy-paste, décisions chiffrées).

${COACH_CONCISENESS_PROMPT}

${COACH_QA_MODE_PROMPT}

## Interdit en mode question libre
- Sections 🎯 SITUATION, 📍 PARCOURS, 📋 PLAN, ➡️ PROCHAINE MICRO-ÉTAPE
- Mentionner l'étape X/8, la phase coach, le jour du plan, « où tu en es »
- Renvoyer vers le quiz ou le parcours (le client a un bouton pour reprendre son plan)

${COACH_LENGTH_QUESTION}

## Ton
Direct, concret, sans intro inutile.`;

function stripProgressionMemory(
  memory?: CoachMemoryContext | null
): CoachMemoryContext | null | undefined {
  if (!memory) return memory;
  return {
    ...memory,
    coachingPhase: undefined,
    coachingStepLabel: undefined,
    progressPoint: '',
    lastAction: '',
  };
}

function buildCoachExpertBlockForMode(
  businessId: BusinessId,
  interactionMode: CoachInteractionMode,
  currentPhase: number,
  techLevel?: string
): string {
  if (interactionMode === 'question') {
    return buildBusinessCoachExpertBlock(businessId, { questionMode: true });
  }
  return buildBusinessCoachExpertBlock(businessId, {
    phaseId: currentPhase,
    techLevel,
    compact: false,
  });
}

export type { CoachMemoryContext } from '@/lib/coach/memory-context';

export function buildCoachSystemPrompt(
  profile?: QuizProfileSnapshot | null,
  memory?: CoachMemoryContext | null,
  roadmapContext?: RoadmapCoachContext | null,
  notepadSnippet?: string,
  interactionMode: CoachInteractionMode = 'progression',
  completedRoadmapTaskIndices: number[] = []
): string {
  if (roadmapContext && interactionMode === 'question') {
    return buildRoadmapCoachQuestionSystemPrompt(
      profile,
      roadmapContext,
      memory,
      notepadSnippet,
      completedRoadmapTaskIndices
    );
  }

  if (roadmapContext) {
    return buildRoadmapCoachFullSystemPrompt(
      profile,
      roadmapContext,
      memory,
      notepadSnippet,
      completedRoadmapTaskIndices
    );
  }

  const freeQuestion = interactionMode === 'question';
  const basePrompt = freeQuestion ? COACH_QUESTION_SYSTEM_PROMPT : COACH_SYSTEM_PROMPT;
  const memoryForPrompt = freeQuestion ? stripProgressionMemory(memory) : memory;

  const businessId = profile?.topBusinessId;
  const techLevel = profile?.techLevel;
  const journeyBlock = freeQuestion ? '' : buildJourneyPromptBlock(businessId, techLevel);
  const currentPhase = memory?.coachingPhase ?? 1;
  const planBlock = freeQuestion
    ? ''
    : buildPlanContextForPrompt(
        currentPhase,
        businessId,
        techLevel,
        memory?.coachingStepLabel
      );

  const memoryBlock = freeQuestion
    ? buildQuestionMemoryPromptBlock(memoryForPrompt, notepadSnippet)
    : buildMemoryPromptBlock(memory, notepadSnippet);
  const modeHint = freeQuestion
    ? ''
    : '\n\n## Mode actif\nLe client avance dans le **parcours 8 étapes** : utilise le format structuré complet.';

  if (!profile) {
    return `${basePrompt}\n\n${buildContextualToolsPromptReference()}\n\n${journeyBlock}\n\n${planBlock}${modeHint}${memoryBlock}`;
  }

  const biz = businessProfiles[profile.topBusinessId];
  const expertBlock = buildCoachExpertBlockForMode(
    profile.topBusinessId,
    interactionMode,
    currentPhase,
    profile.techLevel
  );
  const quizMatch = profile.top3?.find((item) => item.id === profile.topBusinessId)?.percent;
  const modelLine =
    quizMatch != null
      ? `${profile.topBusinessName} (${quizMatch}% compatibilité quiz)`
      : `${profile.topBusinessName} (choisi librement par le client, hors top recommandations)`;

  const copyTier = resolveCopyTier(profile.entrepreneurialLevel);
  const languageBlock = getCoachLanguageBlock(copyTier);

  return `${basePrompt}

${languageBlock}

${journeyBlock}

${planBlock}

${buildContextualToolsPromptReference(profile.topBusinessId)}

## Profil client
- Personnalité : ${profile.personalityLabel}
- Niveau entrepreneurial : ${profile.entrepreneurialLevel ?? 'Non renseigné'}
- Budget de lancement : ${profile.investmentLevel ?? 'Non renseigné'}. Adapte les conseils au budget (MVP léger, no-code, lancement progressif si budget serré)
- Niveau informatique : ${profile.techLevel ?? 'Non renseigné'}. Adapte l'outil site à ce niveau
- Modèle : ${modelLine}
- Marché : ${biz.examples}
- Forces : ${biz.strengths.join(' ; ')}
- Première étape suggérée : ${biz.firstSteps[0] ?? '—'}

Si niveau tech = Débutant → Carrd, Notion, Shopify, Beacons selon le modèle.
Si Intermédiaire → Framer, Webflow.
Si Avancé → options techniques mais propose d'abord le plus rapide pour valider.

${expertBlock}${modeHint}${memoryBlock}`;
}
