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
  /^(comment|pourquoi|quelle|quel|quels|quelles|combien|est-ce que|peux-tu|peut-on|explique|aide-moi|aide moi|différence|c'est quoi|c est quoi|quest ce que|qu est ce|qu'est-ce|que faire|dois-je|faut-il|conseil|conseille|avis|exemple|qu'est-ce|help)/i,
  /\b(comment|pourquoi|quelle|quel|combien|explique|conseille|recommande|compare|choisir entre|meilleur|optimiser|stratégie|pricing|prix|juridique|legal|marketing|vente|prospect|client|outil|plateforme)\b/i,
];

/** Question de définition / clarification — ne doit jamais valider une action Mon plan. */
export function isDefinitionalQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  if (
    /^(quest\s*ce\s*que|qu['']?\s*est[- ]ce\s*qu|qu['']?\s*est\s*qu|c['']?\s*est\s*quoi|c est quoi|d[eé]finis|d[eé]finition\s*(de|d['']|du)?|explique[- ]moi|aide[- ]moi\s+[àa]\s+comprendre)/i.test(
      trimmed
    )
  ) {
    return true;
  }

  // Question courte sans contenu livrable
  if (
    trimmed.length < 120 &&
    /\?/.test(trimmed) &&
    !looksLikeRoadmapDeliverable(trimmed) &&
    !PROGRESSION_PATTERNS.some((pattern) => pattern.test(trimmed))
  ) {
    return true;
  }

  return false;
}

/** Livrable Mon plan (texte, liste, choix…) — pas une simple question. */
export function looksLikeRoadmapDeliverable(userMessage?: string): boolean {
  const text = userMessage?.trim() ?? '';
  if (text.length < 28) return false;
  if (/^(quest\s*ce\s*que|qu['']?\s*est|c['']?\s*est\s*quoi|d[eé]finis|explique[- ]moi)/i.test(text)) {
    return false;
  }

  const signals = [
    /(?:^|\n)\s*(?:[-*•]|\d+[.)])\s+/m,
    /mon client|j'aide|je vise|notre offre|persona|frustration|b2b|b2c|forfait|pitch|accroche/i,
    /.{90,}/,
    /:\s*\S.{12,}/,
    /\n\s*\n/,
    /\b(j'ai|nous avons|voici|mon offre|ma cible|segment|niche)\b/i,
  ];

  return signals.some((pattern) => pattern.test(text));
}

/** Question libre sans livrable — ne pas cocher Mon plan. */
export function isCoachFreeQuestionMessage(userMessage?: string): boolean {
  const text = userMessage?.trim() ?? '';
  if (!text) return false;
  if (looksLikeRoadmapDeliverable(text)) return false;
  return isDefinitionalQuestion(text);
}

/** Mode interaction quand Mon plan est actif : livrables → progression séquentielle. */
export function resolveRoadmapPlanInteractionMode(userMessage?: string): CoachInteractionMode {
  const text = userMessage?.trim() ?? '';
  if (!text) return 'progression';
  if (isDefinitionalQuestion(text)) return 'question';
  if (looksLikeRoadmapDeliverable(text)) return 'progression';
  if (PROGRESSION_PATTERNS.some((pattern) => pattern.test(text))) return 'progression';
  if (text.length >= 60) return 'progression';
  return 'question';
}

/** Détecte si l'utilisateur pose une question libre ou veut avancer dans le parcours 8 étapes. */
export function detectCoachInteractionMode(userMessage?: string): CoachInteractionMode {
  const text = userMessage?.trim() ?? '';
  if (!text) return 'progression';

  if (isDefinitionalQuestion(text)) {
    return 'question';
  }

  const looksLikeQuestion = QUESTION_PATTERNS.some((pattern) => pattern.test(text));
  const looksLikeProgression = PROGRESSION_PATTERNS.some((pattern) => pattern.test(text));

  if (looksLikeProgression && !looksLikeQuestion) {
    return 'progression';
  }

  if (looksLikeQuestion) {
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
