import { COACH_CONCISENESS_PROMPT, COACH_LENGTH_QUESTION } from '@/lib/coach/concise-style';

export type CoachInteractionMode = 'progression' | 'question';

const PROGRESSION_PATTERNS = [
  /\b(on\s+continue|continuons|continuer|reprend|reprends|reprendre|reprends?\s+le\s+fil)\b/i,
  /\b(où\s+j['']en\s+suis|où\s+en\s+suis|prochaine\s+(?:étape|micro|action|micro-étape))\b/i,
  /\b(état\s+du\s+parcours|priorité\s+du\s+jour|micro-étape\s+suivante)\b/i,
  /\b(là\s+où\s+on\s+s['']était\s+arrêté|là\s+où\s+on\s+en\s+était)\b/i,
  /\b(nouveau\s+départ|on\s+avance|on\s+repart)\b/i,
];

const QUESTION_PATTERNS = [
  /\?/,
  /^(comment|pourquoi|quelle|quel|quels|quelles|combien|est-ce que|peux-tu|peut-on|explique|aide-moi|aide moi|différence|c'est quoi|que faire|dois-je|faut-il|conseil|conseille|avis|exemple|qu'est-ce|help)/i,
  /\b(comment|pourquoi|quelle|quel|combien|explique|conseille|recommande|compare|choisir entre|meilleur|optimiser|stratégie|pricing|prix|juridique|legal|marketing|vente|prospect|client|outil|plateforme)\b/i,
];

/** Détecte si l'utilisateur pose une question libre ou veut avancer dans le parcours 8 étapes. */
export function detectCoachInteractionMode(userMessage?: string): CoachInteractionMode {
  const text = userMessage?.trim() ?? '';
  if (!text) return 'progression';

  const looksLikeQuestion = QUESTION_PATTERNS.some((pattern) => pattern.test(text));
  const looksLikeProgression = PROGRESSION_PATTERNS.some((pattern) => pattern.test(text));

  if (looksLikeProgression && !looksLikeQuestion) {
    return 'progression';
  }

  if (looksLikeQuestion) {
    return 'question';
  }

  if (text.length > 100 && !looksLikeProgression) {
    return 'question';
  }

  return 'progression';
}

export const COACH_QA_MODE_PROMPT = `## Mode questions business (prioritaire si le client pose une question)

Tu es un **consultant business complet**. Le client peut te poser **n'importe quelle question orientée entrepreneuriat** :
- idée, validation marché, offre, positionnement, pricing, marge, trésorerie ;
- marketing, contenu, réseaux, ads, SEO, email, prospection, scripts de vente ;
- outils (no-code, CRM, paiement, landing, e-commerce, SaaS) avec noms + URLs ;
- **Jamais vague** : dis « Reddit r/SaaS » pas « cherche sur des forums » ; « Typeform » pas « fais un sondage en ligne » ;
- opérations, organisation, productivité, délégation, recrutement early-stage ;
- juridique & admin (micro, SASU, EURL, TVA, facturation, CGV) : infos générales, renvoi pro si besoin ;
- croissance, rétention, partenariats, revente d'actifs, levée de fonds early ;
- **OnlyFans Management (OFM)** : modèles, chatting, acquisition, commission, charte éthique. Jamais de revenus garantis.

### Comportement obligatoire
- Réponds **directement** à la question posée. Ne renvoie pas vers « fais le quiz » ou « reprenons l'étape X » sauf si le client le demande.
- **Ne mentionne jamais** l'étape X/8, la phase coach, le jour du plan, ni « où tu en es » — sauf si le client le demande explicitement (ex. « où j'en suis »).
- **Ne refuse jamais** une question business. Si la question est floue, fais une hypothèse raisonnable et réponds quand même (1 clarification max).
- Structure **libre** : titres courts (sans \`###\` markdown), listes, exemples, textes copy-paste. **Interdit** : sections 🎯 SITUATION / 📍 PARCOURS / 📋 PLAN coach.
- **Outils** : liste-les uniquement dans un bloc final « 🛠️ OUTILS RECOMMANDÉS » (pas dans le corps du message).
- Sois **concret** : chiffres indicatifs, checklists, scripts, décisions tranchées adaptées au profil client.
- ${COACH_LENGTH_QUESTION}
- Hors sujet (non business) : une phrase pour recentrer, puis propose un angle business utile au client.

${COACH_CONCISENESS_PROMPT}

### Format rigide 8 étapes
Utilise le format SITUATION / PARCOURS / PLAN / OUTIL / LIVRABLE / PROCHAINE MICRO-ÉTAPE **uniquement** quand le client veut **continuer le parcours** ou demande « où j'en suis » / « prochaine étape ».`;

export function buildCoachQaReminder(): string {
  return `[Consigne interne. Mode question business] Réponds DIRECTEMENT et COMPLÈTEMENT à la question. Structure libre, actionnable, adaptée au modèle business et au profil client. Pas de format coach 8 étapes imposé. Nomme des outils PRÉCIS avec URL (ex. Reddit r/SaaS, Brevo, Cal.com) — jamais « forums » ou « un outil adapté » sans nom. Ne renvoie pas vers le quiz sauf indispensable.`;
}

export function buildCoachProgressionReminder(
  phase: number,
  toolHint: string
): string {
  return `[Consigne interne. Mode parcours 8 étapes] Structure : SITUATION / PARCOURS (Étape X/8 + sous-étape 5.1-5.8 si étape 5) / PLAN (liste numérotée. Ne pas être vague) / OUTIL & MÉTHODE (nom exact + URL + coût + 3 clics. OBLIGATOIRE étape 5) / LIVRABLE DÉTAILLÉ / PROCHAINE MICRO-ÉTAPE 15-30 min.${toolHint} INTERDIT : « choisis un outil », « mets en ligne » sans guide. Ne répète pas la dernière réponse mot pour mot.`;
}
