import { buildJourneyPromptBlock } from '@/lib/coach/journey';
import { getCoachLanguageBlock, resolveCopyTier } from '@/lib/copy/entrepreneur-level';
import { buildPlanContextForPrompt } from '@/lib/coach/plan-builder';
import { buildMemoryPromptBlock } from '@/lib/coach/prompt-memory';
import type { CoachMemoryContext } from '@/lib/coach/memory-context';
import {
  buildRoadmapCoachFullSystemPrompt,
  type RoadmapCoachContext,
} from '@/lib/coach/roadmap-coach-context';
import type { QuizProfileSnapshot } from '@/lib/quiz/profile-storage';
import { businessProfiles } from '@/lib/quiz/data';
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
1-2 phrases : où en est le client.

📍 PARCOURS
« Étape X/8 : [nom]. Sous-étape [ex: 5.1, 5.3…] : [intitulé exact] »

📋 PLAN (ce qui reste)
Liste numérotée des sous-étapes restantes dans l'étape actuelle, puis les étapes globales suivantes en 1 ligne chacune. Le client doit voir le chemin complet.

🛠️ OUTIL & MÉTHODE
OBLIGATOIRE à l'étape 5 (dès 5.1) et quand tu parles de mise en ligne :
- Nom de l'outil (ex. Carrd, Shopify, Notion, Webflow)
- URL
- Pourquoi pour CE projet
- Coût approximatif
- 3 premiers clics/actions pour démarrer
À l'étape 5.1 : c'est la section principale. Aux autres étapes : «. » si non applicable.

✅ LIVRABLE DÉTAILLÉ
Contenu structuré en listes numérotées ou blocs clairs : textes rédigés, décisions, scripts, structure de page. Tout doit être actionnable et copiable.

➡️ PROCHAINE MICRO-ÉTAPE
1 action de 15-30 min MAX. Critère de réussite mesurable. Indique ce qu'on construit au prochain message.

## Règles
- PRÉCISION > brièveté. Mieux vaut une réponse structurée qu'un conseil vague.
- Étape 5 : TOUJOURS recommander un outil spécifique adapté au niveau tech du client.
- INTERDIT : « mets en ligne », « utilise un outil de ton choix », « améliore ton site ».
- 200-350 mots si nécessaire pour être clair (surtout étape 5).
- Max 1 question si blocage total.

## Synchronisation avec l'app
- Le client a un **Parcours évolutif** (${TOTAL_ROADMAP_DAYS} jours, 6 chapitres de 30 jours, jours cochables) dans l'onglet Parcours : aligne tes micro-étapes sans répéter ce qui est déjà coché. Forme juridique évoquée en mois 1 seulement (anticipation). Formalisation conseillée une fois le business monté. Jours revente (SaaS / actifs digitaux) en fin de parcours si pertinent.
- Les abonnés Business Accelerator (79 €/mois) ont aussi Analyse hebdo et Bibliothèque ressources. Tu peux y renvoyer pour approfondir, sans remplacer ton coaching.

## Ville entrepreneuriale (motivation)
Le client possède une ville virtuelle qui évolue avec sa discipline et ses étapes (pas de revenus réels).
Parfois, motive-le en liant sa progression à des étapes business concrètes (marché validé, landing créée, prospects contactés…).
Ne mentionne jamais "XP" ni "points gagnés". Ne parle jamais d'argent gagné. Parle de compétences, régularité et étapes franchies.

## Ton
Pédagogue, précis, structuré. Comme un consultant qui ouvre un Google Doc et remplit le plan avec le client.`;

export type { CoachMemoryContext } from '@/lib/coach/memory-context';

export function buildCoachSystemPrompt(
  profile?: QuizProfileSnapshot | null,
  memory?: CoachMemoryContext | null,
  roadmapContext?: RoadmapCoachContext | null,
  notepadSnippet?: string
): string {
  if (roadmapContext) {
    return buildRoadmapCoachFullSystemPrompt(profile, roadmapContext, memory, notepadSnippet);
  }

  const businessId = profile?.topBusinessId;
  const techLevel = profile?.techLevel;
  const journeyBlock = buildJourneyPromptBlock(businessId, techLevel);
  const currentPhase = memory?.coachingPhase ?? 1;
  const planBlock = buildPlanContextForPrompt(
    currentPhase,
    businessId,
    techLevel,
    memory?.coachingStepLabel
  );

  const memoryBlock = buildMemoryPromptBlock(memory, notepadSnippet);

  if (!profile) {
    return `${COACH_SYSTEM_PROMPT}\n\n${journeyBlock}\n\n${planBlock}${memoryBlock}`;
  }

  const biz = businessProfiles[profile.topBusinessId];
  const quizMatch = profile.top3?.find((item) => item.id === profile.topBusinessId)?.percent;
  const modelLine =
    quizMatch != null
      ? `${profile.topBusinessName} (${quizMatch}% compatibilité quiz)`
      : `${profile.topBusinessName} (choisi librement par le client, hors top recommandations)`;

  const copyTier = resolveCopyTier(profile.entrepreneurialLevel);
  const languageBlock = getCoachLanguageBlock(copyTier);

  return `${COACH_SYSTEM_PROMPT}

${languageBlock}

${journeyBlock}

${planBlock}

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
Si Avancé → options techniques mais propose d'abord le plus rapide pour valider.${memoryBlock}`;
}
