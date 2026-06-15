export type ResourceCategoryId = 'idea' | 'launch' | 'ai' | 'growth';

export const PREMIUM_VALUE_BLOCKS = [
  {
    icon: '📋',
    title: 'Templates prêts à copier',
    desc: 'Scripts, emails, pages de vente et prompts. Remplis les [crochets] et agis.',
  },
  {
    icon: '🎯',
    title: 'Adapté à ton modèle',
    desc: 'Freelance, SaaS, e-commerce… chaque ressource parle ton langage métier.',
  },
  {
    icon: '🗺️',
    title: 'Aligné parcours 180 jours',
    desc: 'Les 4 étapes complètent ton parcours premium et le coach en 8 phases.',
  },
  {
    icon: '🤝',
    title: 'Complément du coach IA',
    desc: 'Copie un template, puis demande au coach de l’adapter à ton situation.',
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Choisis ton étape',
    desc: 'Idée → Lancement → IA → Croissance. Si tu débutes, suis l’ordre 1 à 4.',
  },
  {
    step: 2,
    title: 'Ouvre une ressource',
    desc: 'Lis « Comment l’utiliser », suis le conseil débutant, copie le contenu si besoin.',
  },
  {
    step: 3,
    title: 'Passe à l’action',
    desc: 'Coche le jour correspondant dans Parcours ou discute-en avec le coach IA.',
  },
];

export const CATEGORY_GUIDES: Record<
  ResourceCategoryId,
  {
    step: number;
    shortTitle: string;
    beginnerLine: string;
    whenToUse: string;
    roadmapChapters: string;
    coachPhases: string;
  }
> = {
  idea: {
    step: 1,
    shortTitle: 'Trouver une idée',
    beginnerLine: 'Tu débutes ? Commence ici pour clarifier ton projet avant d’investir du temps.',
    whenToUse:
      'Utilise ces outils si tu hésites sur quoi lancer, si tu veux valider une idée, ou si tu repartez de zéro sur un nouveau modèle business.',
    roadmapChapters: 'Chapitre 1 (Lancement). Jours 1 à 15 environ : problème, persona, offre.',
    coachPhases: 'Phases coach 1 à 3 : Vision, Client idéal, Offre & promesse.',
  },
  launch: {
    step: 2,
    shortTitle: 'Lancer',
    beginnerLine: 'Tu as une idée claire ? Passe à l’action avec des modèles prêts à l’emploi.',
    whenToUse:
      'Quand ton offre se dessine : contacter des prospects, rédiger ta page, préparer tes appels et tes emails de vente.',
    roadmapChapters: 'Chapitre 1 fin + début ch. 2. Site, pitch, premiers échanges terrain.',
    coachPhases: 'Phases coach 4 à 5 : Positionnement, Supports & présence en ligne.',
  },
  ai: {
    step: 3,
    shortTitle: 'Aide IA',
    beginnerLine: 'Pas inspiré ? Copie un prompt. BuildrAI Coach ou ChatGPT fait le premier jet.',
    whenToUse:
      'Pour accélérer la rédaction (offre, page, contenu, analyse marché) sans partir d’une page blanche.',
    roadmapChapters: 'Tout au long du parcours. Surtout quand un jour demande de la rédaction.',
    coachPhases: 'Toutes phases. Le coach affine ce que les prompts ont produit.',
  },
  growth: {
    step: 4,
    shortTitle: 'Croissance',
    beginnerLine: 'Prêt à vendre ? Plans concrets pour tes 10 premiers clients et ton suivi hebdo.',
    whenToUse:
      'Une fois l’offre définie : prospection structurée, contenu régulier, KPIs, anticipation juridique (mois 1) et revente (mois 5–6).',
    roadmapChapters: 'Chapitres 2 à 6. Acquisition, rétention, scale, actifs revente.',
    coachPhases: 'Phases coach 6 à 8 : Pricing, Lancement, Premiers clients.',
  },
};

export const RESOURCE_UI: Record<
  string,
  { badge: string; icon: string; beginnerTip: string; format: string }
> = {
  'models-50': {
    badge: 'Inspiration',
    icon: '📋',
    format: 'Liste à parcourir',
    beginnerTip: 'Coche mentalement 3 modèles qui t\'attirent, puis creuse une seule piste.',
  },
  niches: {
    badge: 'Exemples',
    icon: '💡',
    format: 'Idées de niches',
    beginnerTip: 'Choisis une niche que tu comprenez déjà (métier, hobby, réseau).',
  },
  grid: {
    badge: 'Grille',
    icon: '🧮',
    format: '8 questions',
    beginnerTip: 'Réponds honnêtement. Un score faible = pivot, pas abandon.',
  },
  checklist: {
    badge: 'Checklist',
    icon: '✅',
    format: '8 validations',
    beginnerTip: 'Moins de 5 cases cochées ? Affine l’idée avant de lancer.',
  },
  'validation-7d': {
    badge: 'Plan',
    icon: '📅',
    format: '7 jours',
    beginnerTip: 'Un jour = une action. Ne saute pas les conversations clients (J4–J5).',
  },
  landing: {
    badge: 'Template',
    icon: '📄',
    format: 'Texte à remplir',
    beginnerTip: 'Remplace les [crochets], publie sur Carrd ou Notion, améliore avec le coach.',
  },
  outreach: {
    badge: 'Script',
    icon: '💬',
    format: 'Message type',
    beginnerTip: 'Personnalise la 2e phrase. C’est elle qui obtient des réponses.',
  },
  email: {
    badge: 'Emails',
    icon: '✉️',
    format: '3 modèles',
    beginnerTip: 'Email 1 à 10 contacts, relance J+3, closing seulement si intérêt confirmé.',
  },
  social: {
    badge: 'Réseaux',
    icon: '📱',
    format: 'DM + post',
    beginnerTip: '5 messages personnalisés par jour. Qualité > quantité.',
  },
  'client-survey': {
    badge: 'Questionnaire',
    icon: '📝',
    format: '10 questions',
    beginnerTip: 'Appel 20 min avant toute proposition commerciale.',
  },
  pricing: {
    badge: 'Pricing',
    icon: '💶',
    format: 'Grille tarifs',
    beginnerTip: 'Commence par 2 formules max. Simplifie pour vendre plus vite.',
  },
  'mvp-scope': {
    badge: 'MVP',
    icon: '🎯',
    format: 'Checklist',
    beginnerTip: 'Si le MVP dépasse 2 semaines, réduis le périmètre.',
  },
  'prompt-content': {
    badge: 'Prompt IA',
    icon: '🤖',
    format: 'À copier-coller',
    beginnerTip: 'Ajoute ta niche en haut du prompt pour des idées plus précises.',
  },
  'prompt-market': {
    badge: 'Prompt IA',
    icon: '🤖',
    format: 'À copier-coller',
    beginnerTip: 'Vérifie les chiffres sur Google. L’IA donne une base, pas la vérité absolue.',
  },
  'prompt-offer': {
    badge: 'Prompt IA',
    icon: '🤖',
    format: 'À copier-coller',
    beginnerTip: 'Garde un seul package au début.',
  },
  'prompt-sales-page': {
    badge: 'Prompt IA',
    icon: '🤖',
    format: 'À copier-coller',
    beginnerTip: 'Relis à voix haute : si c’est confus, raccourcis.',
  },
  'prompt-coach': {
    badge: 'BuildrAI',
    icon: '🧠',
    format: 'Prompt coach',
    beginnerTip: 'Colle dans le coach IA. Il connaît déjà ton profil quiz.',
  },
  'prompt-roadmap': {
    badge: 'Parcours',
    icon: '🗺️',
    format: 'Prompt jour J',
    beginnerTip: 'Remplace J12 par le numéro du jour que tu travailles.',
  },
  'first-10': {
    badge: 'Plan 14 jours',
    icon: '🎯',
    format: 'Étapes jour par jour',
    beginnerTip: 'Objectif : 2 clients signés, pas la perfection.',
  },
  'content-method': {
    badge: 'Méthode',
    icon: '📣',
    format: 'Routine contenu',
    beginnerTip: '3 posts / semaine pendant 4 semaines minimum.',
  },
  'goals-tracker': {
    badge: 'Suivi',
    icon: '📊',
    format: 'Tableau KPI',
    beginnerTip: 'Mise à jour chaque dimanche. 10 min.',
  },
  'legal-anticipation': {
    badge: 'Juridique',
    icon: '⚖️',
    format: 'Anticipation mois 1',
    beginnerTip: 'Anticiper seulement. Formalise quand tu as clients et CA.',
  },
  retention: {
    badge: 'Fidélisation',
    icon: '🔄',
    format: 'Playbook',
    beginnerTip: 'Un client existant coûte 5× moins qu’un nouveau. Traite-les en priorité.',
  },
  'exit-assets': {
    badge: 'Revente',
    icon: '🏷️',
    format: 'Checklist actifs',
    beginnerTip: 'Documente au fil de l’eau. Pas la veille d’une revente.',
  },
};

export const RESOURCE_FAQ = [
  {
    q: 'Cette bibliothèque est incluse dans quelle formule ?',
    a: 'Exclusivement dans Business Accelerator (79 €/mois). Premium (29 €) inclut le coach IA et le parcours 180 jours, pas cette bibliothèque complète.',
  },
  {
    q: 'Dois-je tout lire avant de commencer ?',
    a: 'Non. Suis l’étape 1 si tu débutes, ou va directement à la ressource qui correspond à ton blocage actuel (script, pricing, prompt…).',
  },
  {
    q: 'Comment lier une ressource au parcours 180 jours ?',
    a: 'Chaque catégorie indique les chapitres concernés. Coche le jour parcours équivalent après avoir appliqué la ressource.',
  },
  {
    q: 'Le coach IA remplace-t-il ces templates ?',
    a: 'Non. Ils se complètent. Copie un template, adapte-le avec le coach, puis valide sur le terrain.',
  },
];

export function getResourceUi(id: string) {
  return (
    RESOURCE_UI[id] ?? {
      badge: 'Ressource',
      icon: '📌',
      format: 'Guide',
      beginnerTip: 'Lis la ressource, puis applique une action concrète cette semaine.',
    }
  );
}
