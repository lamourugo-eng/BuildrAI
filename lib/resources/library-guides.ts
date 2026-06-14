export type ResourceCategoryId = 'idea' | 'launch' | 'ai' | 'growth';

export const PREMIUM_VALUE_BLOCKS = [
  {
    icon: '📋',
    title: 'Templates prêts à copier',
    desc: 'Scripts, emails, pages de vente et prompts. Remplissez les [crochets] et agissez.',
  },
  {
    icon: '🎯',
    title: 'Adapté à votre modèle',
    desc: 'Freelance, SaaS, e-commerce… chaque ressource parle votre langage métier.',
  },
  {
    icon: '🗺️',
    title: 'Aligné parcours 180 jours',
    desc: 'Les 4 étapes complètent votre parcours premium et le coach en 8 phases.',
  },
  {
    icon: '🤝',
    title: 'Complément du coach IA',
    desc: 'Copiez un template, puis demandez au coach de l’adapter à votre situation.',
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Choisissez votre étape',
    desc: 'Idée → Lancement → IA → Croissance. Si vous débutez, suivez l’ordre 1 à 4.',
  },
  {
    step: 2,
    title: 'Ouvrez une ressource',
    desc: 'Lisez « Comment l’utiliser », suivez le conseil débutant, copiez le contenu si besoin.',
  },
  {
    step: 3,
    title: 'Passez à l’action',
    desc: 'Cochez le jour correspondant dans Parcours ou discutez-en avec le coach IA.',
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
    beginnerLine: 'Vous débutez ? Commencez ici pour clarifier votre projet avant d’investir du temps.',
    whenToUse:
      'Utilisez ces outils si vous hésitez sur quoi lancer, si vous voulez valider une idée, ou si vous repartez de zéro sur un nouveau modèle business.',
    roadmapChapters: 'Chapitre 1 (Lancement). Jours 1 à 15 environ : problème, persona, offre.',
    coachPhases: 'Phases coach 1 à 3 : Vision, Client idéal, Offre & promesse.',
  },
  launch: {
    step: 2,
    shortTitle: 'Lancer',
    beginnerLine: 'Vous avez une idée claire ? Passez à l’action avec des modèles prêts à l’emploi.',
    whenToUse:
      'Quand votre offre se dessine : contacter des prospects, rédiger votre page, préparer vos appels et vos emails de vente.',
    roadmapChapters: 'Chapitre 1 fin + début ch. 2. Site, pitch, premiers échanges terrain.',
    coachPhases: 'Phases coach 4 à 5 : Positionnement, Supports & présence en ligne.',
  },
  ai: {
    step: 3,
    shortTitle: 'Aide IA',
    beginnerLine: 'Pas inspiré ? Copiez un prompt. BuildrAI Coach ou ChatGPT fait le premier jet.',
    whenToUse:
      'Pour accélérer la rédaction (offre, page, contenu, analyse marché) sans partir d’une page blanche.',
    roadmapChapters: 'Tout au long du parcours. Surtout quand un jour demande de la rédaction.',
    coachPhases: 'Toutes phases. Le coach affine ce que les prompts ont produit.',
  },
  growth: {
    step: 4,
    shortTitle: 'Croissance',
    beginnerLine: 'Prêt à vendre ? Plans concrets pour vos 10 premiers clients et votre suivi hebdo.',
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
    beginnerTip: 'Cochez mentalement 3 modèles qui vous attirent, puis creusez une seule piste.',
  },
  niches: {
    badge: 'Exemples',
    icon: '💡',
    format: 'Idées de niches',
    beginnerTip: 'Choisissez une niche que vous comprenez déjà (métier, hobby, réseau).',
  },
  grid: {
    badge: 'Grille',
    icon: '🧮',
    format: '8 questions',
    beginnerTip: 'Répondez honnêtement. Un score faible = pivot, pas abandon.',
  },
  checklist: {
    badge: 'Checklist',
    icon: '✅',
    format: '8 validations',
    beginnerTip: 'Moins de 5 cases cochées ? Affinez l’idée avant de lancer.',
  },
  'validation-7d': {
    badge: 'Plan',
    icon: '📅',
    format: '7 jours',
    beginnerTip: 'Un jour = une action. Ne sautez pas les conversations clients (J4–J5).',
  },
  landing: {
    badge: 'Template',
    icon: '📄',
    format: 'Texte à remplir',
    beginnerTip: 'Remplacez les [crochets], publiez sur Carrd ou Notion, améliorez avec le coach.',
  },
  outreach: {
    badge: 'Script',
    icon: '💬',
    format: 'Message type',
    beginnerTip: 'Personnalisez la 2e phrase. C’est elle qui obtient des réponses.',
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
    beginnerTip: 'Commencez par 2 formules max. Simplifiez pour vendre plus vite.',
  },
  'mvp-scope': {
    badge: 'MVP',
    icon: '🎯',
    format: 'Checklist',
    beginnerTip: 'Si le MVP dépasse 2 semaines, réduisez le périmètre.',
  },
  'prompt-content': {
    badge: 'Prompt IA',
    icon: '🤖',
    format: 'À copier-coller',
    beginnerTip: 'Ajoutez votre niche en haut du prompt pour des idées plus précises.',
  },
  'prompt-market': {
    badge: 'Prompt IA',
    icon: '🤖',
    format: 'À copier-coller',
    beginnerTip: 'Vérifiez les chiffres sur Google. L’IA donne une base, pas la vérité absolue.',
  },
  'prompt-offer': {
    badge: 'Prompt IA',
    icon: '🤖',
    format: 'À copier-coller',
    beginnerTip: 'Gardez un seul package au début.',
  },
  'prompt-sales-page': {
    badge: 'Prompt IA',
    icon: '🤖',
    format: 'À copier-coller',
    beginnerTip: 'Relisez à voix haute : si c’est confus, raccourcissez.',
  },
  'prompt-coach': {
    badge: 'BuildrAI',
    icon: '🧠',
    format: 'Prompt coach',
    beginnerTip: 'Collez dans le coach IA. Il connaît déjà votre profil quiz.',
  },
  'prompt-roadmap': {
    badge: 'Parcours',
    icon: '🗺️',
    format: 'Prompt jour J',
    beginnerTip: 'Remplacez J12 par le numéro du jour que vous travaillez.',
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
    beginnerTip: 'Anticiper seulement. Formalisez quand vous avez clients et CA.',
  },
  retention: {
    badge: 'Fidélisation',
    icon: '🔄',
    format: 'Playbook',
    beginnerTip: 'Un client existant coûte 5× moins qu’un nouveau. Traitez-les en priorité.',
  },
  'exit-assets': {
    badge: 'Revente',
    icon: '🏷️',
    format: 'Checklist actifs',
    beginnerTip: 'Documentez au fil de l’eau. Pas la veille d’une revente.',
  },
};

export const RESOURCE_FAQ = [
  {
    q: 'Cette bibliothèque est incluse dans quelle formule ?',
    a: 'Exclusivement dans Business Accelerator (99 €/mois). Premium (29 €) inclut le coach IA et le parcours 180 jours, pas cette bibliothèque complète.',
  },
  {
    q: 'Dois-je tout lire avant de commencer ?',
    a: 'Non. Suivez l’étape 1 si vous débutez, ou allez directement à la ressource qui correspond à votre blocage actuel (script, pricing, prompt…).',
  },
  {
    q: 'Comment lier une ressource au parcours 180 jours ?',
    a: 'Chaque catégorie indique les chapitres concernés. Cochez le jour parcours équivalent après avoir appliqué la ressource.',
  },
  {
    q: 'Le coach IA remplace-t-il ces templates ?',
    a: 'Non. Ils se complètent. Copiez un template, adaptez-le avec le coach, puis validez sur le terrain.',
  },
];

export function getResourceUi(id: string) {
  return (
    RESOURCE_UI[id] ?? {
      badge: 'Ressource',
      icon: '📌',
      format: 'Guide',
      beginnerTip: 'Lisez la ressource, puis appliquez une action concrète cette semaine.',
    }
  );
}
