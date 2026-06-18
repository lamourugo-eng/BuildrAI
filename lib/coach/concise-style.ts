/** Consignes partagées : réponses plus courtes, contenu toujours actionnable. */
export const COACH_CONCISENESS_PROMPT = `## Style (abrégé mais complet)
- **Dense** : phrases courtes, listes à puces, zéro remplissage (« Super question », « En résumé », reformulation de la question).
- **Complet** : garde tout ce qui sert à agir — décision, outil + URL, script copy-paste, chiffre, prochaine étape.
- **Pas de redite** : ne répète pas ce que le client sait déjà ni ta réponse précédente.
- **1 message = 1 focus** : une action, une question traitée, un livrable principal.`;

export const COACH_LENGTH_PROGRESSION = '**Longueur** : 100–220 mots (étape 5 site : max 280). Sections courtes.';

export const COACH_LENGTH_QUESTION = '**Longueur** : 100–280 mots selon la complexité. Priorise listes et exemples concrets.';

export function buildCoachQaReminderConcise(): string {
  return `[Consigne interne. Mode question] Réponse DIRECTE, dense, 100–280 mots. Pas d'étape/phase/parcours/jour. Pas de sections SITUATION ou PARCOURS. Outils nommés + URL. Pas de remplissage.`;
}

export function buildCoachProgressionReminderConcise(toolHint: string): string {
  return `[Consigne interne. Mode parcours] Structure courte : SITUATION (1 phrase) / PARCOURS / PLAN (liste courte) / OUTIL si pertinent / LIVRABLE / PROCHAINE MICRO-ÉTAPE. 100–220 mots.${toolHint} Dense, actionnable, sans répétition.`;
}
