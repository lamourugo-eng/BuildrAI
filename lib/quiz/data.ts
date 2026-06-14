export type BusinessId =
  | 'saas'
  | 'freelance'
  | 'ecommerce'
  | 'agency'
  | 'marketplace'
  | 'impact'
  | 'consulting'
  | 'content'
  | 'ofm';

export type PersonalityId =
  | 'pioneer'
  | 'builder'
  | 'artisan'
  | 'connector'
  | 'creator'
  | 'changemaker';

export interface BusinessProfile {
  id: BusinessId;
  name: string;
  icon: string;
  description: string;
  traits: string[];
  examples: string;
  strengths: string[];
  challenges: string[];
  firstSteps: string[];
  metrics: { cost: string; revenue: string; scale: string; autonomy: string };
  whyMatch: string;
}

export interface QuizOption {
  icon: string;
  label: string;
  desc: string;
  scores: Partial<Record<BusinessId, number>>;
}

export type LevelDimension = 'entrepreneurial' | 'tech' | 'investment';

export type InvestmentBand = 'minimal' | 'moderate' | 'substantial';

export type BusinessCostBand = 'low' | 'medium' | 'high';

export const businessCostBand: Record<BusinessId, BusinessCostBand> = {
  freelance: 'low',
  consulting: 'low',
  content: 'low',
  agency: 'low',
  ofm: 'low',
  impact: 'medium',
  ecommerce: 'medium',
  saas: 'high',
  marketplace: 'high',
};

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
  /** Question de niveau. Enregistrée pour le coach, pas listée dans dimensionLabels classiques */
  levelDimension?: LevelDimension;
}

export const businessProfiles: Record<BusinessId, BusinessProfile> = {
  saas: {
    id: 'saas',
    name: 'SaaS',
    icon: '💻',
    description:
      "Tu crées un logiciel en ligne que tes clients paient chaque mois. Deux voies possibles selon ta préférence : le B2B (tu vends aux entreprises. Ex. Facturation, RH, gestion d'équipe) ou le B2C (tu vends aux particuliers. Ex. Apps fitness, productivité, créativité). Dans les deux cas, l'abonnement génère des revenus récurrents et prévisibles. Le B2B vend souvent plus cher mais prend plus de temps ; le B2C peut aller plus vite mais demande plus de volume.",
    traits: ['Réfléchi', 'Produit', 'Abonnement', 'Équipe'],
    examples: 'B2B : Pennylane, Slack. B2C : Duolingo, Canva',
    strengths: [
      'Revenus chaque mois, prévisibles',
      'Peut grandir sans limite de lieu',
      'Très intéressant pour les investisseurs',
    ],
    challenges: [
      'Choisir entre B2B (plus lent, plus rentable) et B2C (plus rapide, plus compétitif)',
      'Il faut une bonne équipe technique',
      'Beaucoup de concurrence',
    ],
    firstSteps: [
      'Clarifier avec ton coach le problème précis à résoudre et le type de client (B2B ou B2C)',
      'Co-construire ton proposition de valeur et ce qui rend ton SaaS unique',
      'Définir ensemble la première version concrète de ton offre (fonctionnalités, prix, promesse)',
    ],
    metrics: { cost: 'Moyen', revenue: '3-6 mois', scale: 'Très forte', autonomy: 'Équipe' },
    whyMatch:
      'Tu aimes réfléchir, structurer et construire un produit avec des revenus réguliers.',
  },
  freelance: {
    id: 'freelance',
    name: 'Freelance',
    icon: '🎯',
    description:
      "Tu travailles en indépendant et factures tes missions au cas par cas : conseil, design, développement, rédaction… Tu es ton propre patron, sans salariés au départ. C'est le moyen le plus rapide de monétiser une compétence. Chaque heure travaillée se transforme en revenu. Moins scalable qu'un produit, mais très libre et peu coûteux à lancer.",
    traits: ['Libre', 'Expert', 'Souple', 'Solo'],
    examples: 'Consultant, designer, développeur',
    strengths: [
      'On peut commencer tout de suite',
      'Tu décides de tout',
      'Plus tu travailles, plus tu gagnes',
    ],
    challenges: [
      'Revenus limités par ton temps',
      'Il faut trouver des clients seul',
      'Parfois des mois plus difficiles',
    ],
    firstSteps: [
      'Identifier avec ton coach ton expertise différenciante et ton client idéal',
      'Formuler une offre claire : résultat promis, format de mission, fourchette de prix',
      'Préparer ton premier pitch personnalisé pour tes premiers prospects',
    ],
    metrics: { cost: 'Très faible', revenue: '1-2 mois', scale: 'Moyenne', autonomy: 'Totale' },
    whyMatch: 'Tu veux être libre et avancer à ton rythme, avec ton expertise.',
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: '🛍️',
    description:
      "Tu vends des produits physiques ou digitaux directement aux particuliers via ton site ou des plateformes. Tu gères la marque, le stock (ou les fournisseurs) et la relation client. On peut tester une idée produit vite avec une petite collection ou des précommandes. Convient aux profils créatifs qui aiment le contact direct avec leurs acheteurs.",
    traits: ['Créatif', 'Vente', 'Rapide', 'Marque'],
    examples: 'Mode, cosmétiques, produits de niche',
    strengths: [
      'On teste vite une idée produit',
      'Une belle histoire de marque aide beaucoup',
      'Contact direct avec le client',
    ],
    challenges: [
      'Stock et livraison à gérer',
      'Coût pour trouver des clients',
      'Concurrence sur les grandes plateformes',
    ],
    firstSteps: [
      'Définir avec ton coach ton niche, ton client type et ton angle de marque',
      'Structurer ta première gamme produit et ton promesse client',
      'Construire un plan de lancement personnalisé (offre, prix, canal de vente)',
    ],
    metrics: { cost: 'Moyen', revenue: '2-4 mois', scale: 'Forte', autonomy: 'Souple' },
    whyMatch: 'Tu es créatif et tu aimes aller vite pour lancer une marque.',
  },
  agency: {
    id: 'agency',
    name: 'Agence',
    icon: '🤝',
    description:
      "Tu montes une équipe qui réalise des prestations pour des clients : site web, campagne marketing, recrutement, design… Chaque projet est facturé à part. Le premier client peut arriver vite grâce à ton réseau. La croissance passe surtout par la réputation et le bouche-à-oreille. Bien adapté si tu aimes le relationnel et mener des projets de A à Z.",
    traits: ['Contact', 'Équipe', 'Vente', 'Projets'],
    examples: 'Agence web, marketing, RH',
    strengths: [
      'Premier euro dès la première mission',
      'On grandit grâce à la réputation',
      'Le relationnel est ton force',
    ],
    challenges: [
      'Dépendance aux clients',
      'Moins de marge si mal organisé',
      'Difficile de grandir sans embaucher',
    ],
    firstSteps: [
      'Choisir avec ton coach une spécialisation (secteur + type de prestation)',
      'Définir ton offre signature, ton process de delivery et ton pricing',
      'Préparer ton stratégie pour signer tes 3 premiers clients cibles',
    ],
    metrics: { cost: 'Faible', revenue: '1-3 mois', scale: 'Moyenne', autonomy: 'Équipe' },
    whyMatch: 'Tu aimes les gens et travailler en équipe sur des projets concrets.',
  },
  marketplace: {
    id: 'marketplace',
    name: 'Marketplace',
    icon: '🌐',
    description:
      "Tu crées une plateforme qui met en relation deux types d'utilisateurs : ceux qui offrent un service/produit et ceux qui le cherchent (comme Airbnb, Uber ou Etsy). Tu prends une commission sur chaque transaction. Le potentiel de croissance est énorme, mais au départ il faut résoudre le problème de la poule et l'œuf : attirer assez d'offre ET de demande. Pour les profils ambitieux et orientés réseau.",
    traits: ['Réseau', 'Grandir', 'Audace', 'Plateforme'],
    examples: 'Airbnb, Etsy, Doctolib',
    strengths: [
      "Plus il y a d'utilisateurs, plus c'est utile",
      'Peut devenir très grand',
      'Tout le monde y gagne',
    ],
    challenges: [
      "Au début : peu d'offre ou peu de demande",
      'Souvent cher à lancer',
      'Il faut inspirer confiance',
    ],
    firstSteps: [
      'Identifier avec ton coach quel côté de la marketplace lancer en premier et pourquoi',
      'Définir ton marché de départ (géographie, niche, proposition de valeur)',
      'Structurer la confiance et l\'expérience utilisateur de tes premiers membres',
    ],
    metrics: { cost: 'Élevé', revenue: '6-12 mois', scale: 'Exceptionnelle', autonomy: 'Réseau' },
    whyMatch: 'Tu es audacieux et tu aimes connecter les gens.',
  },
  impact: {
    id: 'impact',
    name: 'Impact / social',
    icon: '🌱',
    description:
      "Ton activité répond à un problème social ou environnemental tout en étant rentable : recyclage, inclusion, éducation, santé accessible… Les clients achètent parce que le produit est utile ET parce qu'ils adhèrent à ton mission. La motivation est forte, mais il faut prouver que le modèle économique tient la route. Pas seulement l'impact.",
    traits: ['Mission', 'Utile', 'Communauté', 'Sens'],
    examples: 'Recyclage, inclusion, éducation',
    strengths: [
      'Motivation très forte',
      'Clients fidèles qui partagent tes valeurs',
      'Aides et fonds dédiés existent',
    ],
    challenges: [
      'Trouver le bon équilibre impact / rentabilité',
      'Bien expliquer ton mission',
      'Parfois plus lent au départ',
    ],
    firstSteps: [
      "Clarifier avec ton coach l'impact visé et le modèle économique qui le soutient",
      'Définir ton offre : qui paie, pour quoi, et comment l\'impact se mesure',
      'Construire un plan de validation auprès de tes premiers bénéficiaires et clients',
    ],
    metrics: { cost: 'Variable', revenue: '3-6 mois', scale: 'Forte', autonomy: 'Mission' },
    whyMatch: "Ce qui compte pour toi, c'est d'avoir un impact positif.",
  },
  consulting: {
    id: 'consulting',
    name: 'Consulting',
    icon: '📊',
    description:
      "Tu vends ton expertise à des entreprises sur des sujets précis : stratégie, finance, organisation, digital… Pas besoin de créer un produit : tu factures des missions ou des forfaits. Les marges peuvent être élevées dès le début si ta réputation est solide. Moins spectaculaire qu'une startup, mais plus stable et moins risqué. Parfait pour un profil méthodique.",
    traits: ['Expert', 'Méthode', 'Confiance', 'Précis'],
    examples: 'Stratégie, finance, organisation',
    strengths: [
      'Bonnes marges dès le début',
      'Pas besoin de créer un produit',
      'La confiance protège ton activité',
    ],
    challenges: [
      'Il faut se faire connaître',
      'Dur de déléguer au début',
      'Revenus limités sans autre offre',
    ],
    firstSteps: [
      'Identifier avec ton coach ton domaine d\'expertise et le problème business que tu résolvez',
      'Structurer 1 à 2 offres de conseil claires (résultat, durée, prix)',
      'Préparer ton positionnement et ton approche pour convertir ton réseau',
    ],
    metrics: { cost: 'Très faible', revenue: '1-2 mois', scale: 'Moyenne', autonomy: 'Forte' },
    whyMatch: 'Tu es rigoureux et prudent. Le conseil te va bien.',
  },
  content: {
    id: 'content',
    name: 'Creator / média',
    icon: '🎬',
    description:
      "Tu construis une audience (YouTube, newsletter, podcast, réseaux sociaux) et la monétises : formations, sponsoring, produits, abonnements. Tu es la « marque ». Le coût de départ est faible, mais les revenus mettent souvent 6 à 12 mois à décoller. Il faut publier régulièrement. Pour ceux qui aiment créer du contenu et se mettre en avant.",
    traits: ['Créatif', 'Audience', 'Histoire', 'Solo'],
    examples: 'YouTube, newsletter, podcast, cours en ligne',
    strengths: [
      'Peu cher pour commencer',
      "L'audience grandit avec le temps",
      "Plusieurs façons de gagner de l'argent",
    ],
    challenges: [
      "L'argent arrive souvent après 6-12 mois",
      'Il faut publier régulièrement',
      'La visibilité change souvent',
    ],
    firstSteps: [
      'Définir avec ton coach ton niche, ton audience cible et ton promesse éditoriale',
      'Structurer ton ligne éditoriale et ton premier produit monétisable',
      'Construire un plan de publication et de conversion sur 30 jours',
    ],
    metrics: { cost: 'Très faible', revenue: '4-8 mois', scale: 'Forte', autonomy: 'Totale' },
    whyMatch: 'Tu es créatif et tu aimes t\'exprimer devant un public.',
  },
  ofm: {
    id: 'ofm',
    name: 'OnlyFans Management (OFM)',
    icon: '🤝',
    description:
      "Tu lances ou développes une activité d'OnlyFans Management (OFM) : agence ou manager solo qui accompagne des modèles OnlyFans. Stratégie de contenu, acquisition d'abonnés, chatting, organisation ops et monétisation (abonnements, PPV, tips). Tu ne crées pas le contenu à leur place : tu structures la croissance business pendant que le modèle garde le contrôle de son image et de ce qu'il publie.",
    traits: ['Professionnel', 'Management', 'OnlyFans', 'Relationnel'],
    examples: 'Agence OFM, manager solo 2–5 modèles OnlyFans, spécialiste chatting & acquisition',
    strengths: [
      'Revenus par commission sur les revenus OnlyFans des modèles gérés',
      'Peu de stock. Compétence organisation, acquisition et ops',
      'Demande forte si l\'accompagnement est professionnel et transparent',
      'Modèle scalable en recrutant des chatters ou managers',
    ],
    challenges: [
      'Réputation du secteur. Se différencier par transparence, charte éthique et résultats réels',
      'Recruter des modèles OnlyFans alignés (niche, objectifs, limites)',
      'Cadre légal et fiscal (contrats, TVA, conformité OnlyFans & RGPD)',
    ],
    firstSteps: [
      'Formaliser ton cadre OFM : consentement, limites de contenu, partage des revenus, confidentialité',
      'Définir ton niche de modèles OnlyFans et ton offre (chatting, acquisition, contenu, ops)',
      'Signer un contrat OFM clair avant tout management. Le modèle reste décisionnaire',
    ],
    metrics: { cost: 'Faible', revenue: '2-4 mois', scale: 'Forte', autonomy: 'Équipe' },
    whyMatch:
      'Tu veux structurer une activité OnlyFans Management professionnelle, avec éthique et transparence.',
  },
};

export const dimensionLabels = [
  { key: 'risk', label: 'Rapport au risque', values: ['J\'ose', 'Équilibré', 'Prudent'] },
  { key: 'work', label: 'Façon de travailler', values: ['Seul', 'Équipe', 'Réseau'] },
  { key: 'motivation', label: 'Ce qui te motive', values: ['Créer', 'Résoudre', 'Aider'] },
  { key: 'pace', label: 'Ton rythme', values: ['Rapide', 'Étape par étape', 'Souple'] },
  { key: 'strength', label: 'Ta force', values: ['Contact & vente', 'Technique', 'Créatif'] },
  { key: 'model', label: 'Type de revenus', values: ['Chaque mois', 'Par mission', 'En volume'] },
  { key: 'investment', label: 'Budget de lancement', values: ['Budget serré', 'Budget modéré', 'Budget confortable'] },
  { key: 'entrepreneurial', label: 'Niveau entrepreneurial', values: ['Débutant', 'Intermédiaire', 'Expérimenté'] },
  { key: 'tech', label: 'Niveau informatique', values: ['Débutant', 'Intermédiaire', 'Avancé'] },
];

export const levelSummaries: Record<
  Exclude<LevelDimension, 'investment'>,
  { label: string; desc: string }[]
> = {
  entrepreneurial: [
    { label: 'Débutant', desc: 'Tu découvres l\'entrepreneuriat ou n\'as pas encore lancé de projet.' },
    { label: 'Intermédiaire', desc: 'Tu as déjà testé des idées, side-projects ou petites activités.' },
    { label: 'Expérimenté', desc: 'Tu as déjà lancé ou fait tourner un business.' },
  ],
  tech: [
    { label: 'Débutant', desc: 'Peu à l\'aise avec l\'informatique. Tu préfères des outils simples et guidés.' },
    { label: 'Intermédiaire', desc: 'À l\'aise au quotidien : sites, apps, réseaux sociaux, outils en ligne.' },
    { label: 'Avancé', desc: 'Bon niveau technique. Tu codes, automatises ou configures des systèmes.' },
  ],
};

export const investmentSummaries: { label: string; desc: string }[] = [
  {
    label: 'Budget serré',
    desc: 'Moins de 100 €. Tu lances avec le strict minimum : outils gratuits, validation rapide, croissance organique.',
  },
  {
    label: 'Budget modéré',
    desc: '100 à 1 000 €. Tu peux investir progressivement : nom de domaine, site simple, premiers outils ou pub ciblée.',
  },
  {
    label: 'Budget confortable',
    desc: 'Plus de 1 000 €. Tu disposes d\'un budget pour accélérer : produit, technique, stock ou marketing dès le départ.',
  },
];

export const quizQuestions: QuizQuestion[] = [
  {
    question: 'Face au risque, tu es plutôt…',
    options: [
      { icon: '🚀', label: 'J\'ose beaucoup', desc: 'J\'aime viser grand et tenter de nouvelles choses', scores: { marketplace: 3, ecommerce: 2, saas: 1 } },
      { icon: '⚖️', label: 'Équilibré', desc: 'Je réfléchis avant de me lancer', scores: { saas: 2, agency: 2, consulting: 1 } },
      { icon: '🛡️', label: 'Prudent', desc: 'J\'avance petit à petit, sans tout risquer', scores: { consulting: 3, freelance: 2, content: 1 } },
    ],
  },
  {
    question: 'Tu préfères travailler…',
    options: [
      { icon: '🧘', label: 'Seul', desc: 'Je décide de tout moi-même', scores: { freelance: 3, content: 2, consulting: 1 } },
      { icon: '👥', label: 'En petite équipe', desc: 'Avec quelques personnes de confiance', scores: { saas: 2, agency: 3, impact: 1 } },
      { icon: '🌍', label: 'En reliant des gens', desc: 'J\'aime mettre les bonnes personnes en contact', scores: { marketplace: 3, ofm: 2, agency: 1, impact: 2 } },
    ],
  },
  {
    question: 'Ce qui te motive le plus…',
    options: [
      { icon: '💡', label: 'Créer du nouveau', desc: 'Imaginer des produits ou des expériences', scores: { ecommerce: 2, content: 2, saas: 2 } },
      { icon: '🔧', label: 'Résoudre un problème', desc: 'Apporter des solutions concrètes', scores: { saas: 3, consulting: 2, agency: 1 } },
      { icon: '❤️', label: 'Aider / faire du bien', desc: 'Contribuer à un monde meilleur', scores: { impact: 3, ofm: 1, content: 1, agency: 1 } },
    ],
  },
  {
    question: 'Ton rythme idéal…',
    options: [
      { icon: '⚡', label: 'Rapide', desc: 'Tester vite, corriger, avancer', scores: { ecommerce: 3, marketplace: 2, content: 1 } },
      { icon: '📈', label: 'Étape par étape', desc: 'Construire sur le long terme, bien organisé', scores: { saas: 3, consulting: 2, agency: 1 } },
      { icon: '🎨', label: 'Souple', desc: 'M\'adapter selon l\'envie et l\'inspiration', scores: { content: 3, freelance: 2, ofm: 1, impact: 1 } },
    ],
  },
  {
    question: 'Ton plus grande force…',
    options: [
      { icon: '🗣️', label: 'Contact & vente', desc: 'Convaincre, négocier, créer des liens', scores: { agency: 3, ofm: 2, marketplace: 2, consulting: 1 } },
      { icon: '⚙️', label: 'Technique', desc: 'Construire, améliorer, automatiser', scores: { saas: 3, ecommerce: 1, freelance: 1 } },
      { icon: '✍️', label: 'Créatif', desc: 'Raconter, dessiner, inspirer', scores: { content: 3, ofm: 2, ecommerce: 2, impact: 1 } },
    ],
  },
  {
    question: 'Pour gagner de l\'argent, tu préfères…',
    options: [
      { icon: '🔄', label: 'Chaque mois (abonnement)', desc: 'Des revenus réguliers et prévisibles', scores: { saas: 3, content: 1, agency: 1 } },
      { icon: '💼', label: 'Par mission ou projet', desc: 'Facturer au temps ou à la prestation', scores: { freelance: 3, ofm: 2, consulting: 2, agency: 2 } },
      { icon: '📦', label: 'En vendant beaucoup', desc: 'Beaucoup de ventes ou beaucoup d\'utilisateurs', scores: { ecommerce: 2, marketplace: 3, saas: 1 } },
    ],
  },
  {
    question: 'Quel budget peux-tu consacrer au lancement ?',
    levelDimension: 'investment',
    options: [
      {
        icon: '🪙',
        label: 'Budget serré',
        desc: 'Moins de 100 €. Démarrer avec le minimum',
        scores: { freelance: 3, consulting: 3, content: 3, ofm: 2, agency: 2 },
      },
      {
        icon: '💳',
        label: 'Budget modéré',
        desc: '100 à 1 000 €. Investir progressivement',
        scores: { ecommerce: 3, agency: 2, freelance: 2, ofm: 2, impact: 2, consulting: 2, content: 1, saas: 1 },
      },
      {
        icon: '💰',
        label: 'Budget confortable',
        desc: 'Plus de 1 000 €. Financer produit, technique ou marketing',
        scores: { saas: 3, marketplace: 3, ecommerce: 2, agency: 2, impact: 1 },
      },
    ],
  },
  {
    question: 'Ton niveau entrepreneurial…',
    levelDimension: 'entrepreneurial',
    options: [
      { icon: '🌱', label: 'Débutant', desc: 'Je découvre ou je n\'ai jamais vraiment lancé de projet', scores: { consulting: 2, freelance: 2, content: 2, ofm: 1 } },
      { icon: '🚀', label: 'Intermédiaire', desc: 'J\'ai déjà testé des idées ou des side-projects', scores: { ecommerce: 2, agency: 2, saas: 1 } },
      { icon: '🏆', label: 'Expérimenté', desc: 'J\'ai déjà lancé ou fait tourner un business', scores: { saas: 2, marketplace: 2, agency: 1 } },
    ],
  },
  {
    question: 'Ton niveau avec l\'informatique…',
    levelDimension: 'tech',
    options: [
      { icon: '📱', label: 'Débutant', desc: 'Je débute. J\'ai besoin d\'outils simples et bien guidés', scores: { agency: 2, ofm: 2, consulting: 2, content: 2 } },
      { icon: '💻', label: 'Intermédiaire', desc: 'Je maîtrise les outils courants (sites, apps, réseaux)', scores: { ecommerce: 2, freelance: 2, content: 1 } },
      { icon: '⚙️', label: 'Avancé', desc: 'Je code ou je configure des systèmes moi-même', scores: { saas: 3, freelance: 1, ecommerce: 1 } },
    ],
  },
];

export const profileLabels: Record<
  PersonalityId,
  { label: string; desc: string; traits: string[] }
> = {
  pioneer: {
    label: 'Aventurier',
    desc: 'Tu vises grand, tu oses et tu n\'as pas peur de l\'inconnu.',
    traits: ['Visionnaire', 'Ambitieux', 'Tenace', 'Veut grandir'],
  },
  builder: {
    label: 'Bâtisseur organisé',
    desc: 'Tu avances avec méthode et tu penses long terme.',
    traits: ['Réfléchi', 'Organisé', 'Patient', 'Orienté produit'],
  },
  artisan: {
    label: 'Indépendant expert',
    desc: 'Tu travailles bien seul et tu mises sur ton savoir-faire.',
    traits: ['Libre', 'Expert', 'Pratique', 'Souple'],
  },
  connector: {
    label: 'Façonnier de liens',
    desc: 'Ta force : rassembler les bonnes personnes et créer des opportunités.',
    traits: ['À l\'écoute', 'Sociable', 'Bon négociateur', 'Esprit d\'équipe'],
  },
  creator: {
    label: 'Créateur',
    desc: 'Ton énergie vient de la création, des idées et de ton image.',
    traits: ['Créatif', 'Expressif', 'Intuitif', 'Proche du public'],
  },
  changemaker: {
    label: 'Engagé',
    desc: 'Tu entrepreneus surtout pour avoir un impact positif et du sens.',
    traits: ['Engagé', 'À l\'écoute', 'Visionnaire', 'Guidé par une mission'],
  },
};

export const personalityMap: Record<BusinessId, PersonalityId> = {
  marketplace: 'pioneer',
  ecommerce: 'creator',
  saas: 'builder',
  agency: 'connector',
  freelance: 'artisan',
  consulting: 'builder',
  content: 'creator',
  impact: 'changemaker',
  ofm: 'connector',
};
