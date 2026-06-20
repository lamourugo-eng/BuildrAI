export type FounderStyle = 'builder' | 'strategist' | 'creative' | 'connector';

export interface FounderStyleDef {
  id: FounderStyle;
  label: string;
  emoji: string;
  desc: string;
}

export interface CityLevel {
  id: number;
  name: string;
  minXp: number;
  tagline: string;
  scene: 'seed' | 'awakening' | 'growing' | 'hub' | 'ecosystem';
  visualTier: 'beginner' | 'intermediate' | 'advanced';
  accent: string;
}

export interface CityBuildingDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  slot: { x: number; y: number };
  scale?: number;
}

export const FOUNDER_STYLES: FounderStyleDef[] = [
  {
    id: 'builder',
    label: 'Builder',
    emoji: '🏗️',
    desc: 'Construire, structurer, exécuter.',
  },
  {
    id: 'strategist',
    label: 'Stratège',
    emoji: '🎯',
    desc: 'Vision, priorités, décisions nettes.',
  },
  {
    id: 'creative',
    label: 'Créateur',
    emoji: '✨',
    desc: 'Idées, contenu, différenciation.',
  },
  {
    id: 'connector',
    label: 'Networker',
    emoji: '🤝',
    desc: 'Relations, partenariats, communauté.',
  },
];

export const CITY_LEVELS: CityLevel[] = [
  {
    id: 1,
    name: 'Débutant',
    minXp: 0,
    tagline: 'Un petit bureau, un terrain vide. Tu poses la première pierre.',
    scene: 'seed',
    visualTier: 'beginner',
    accent: '#94a3b8',
  },
  {
    id: 2,
    name: 'En croissance',
    minXp: 80,
    tagline: 'Ton espace s\'agrandit. Les premières structures émergent.',
    scene: 'awakening',
    visualTier: 'beginner',
    accent: '#60a5fa',
  },
  {
    id: 3,
    name: 'Intermédiaire',
    minXp: 200,
    tagline: 'Des bâtiments apparaissent, tes premiers alliés rejoignent l\'aventure.',
    scene: 'growing',
    visualTier: 'intermediate',
    accent: '#818cf8',
  },
  {
    id: 4,
    name: 'Avancé',
    minXp: 450,
    tagline: 'Quartier d\'entreprise. Ton écosystème prend forme.',
    scene: 'hub',
    visualTier: 'advanced',
    accent: '#a78bfa',
  },
  {
    id: 5,
    name: 'Entrepreneur accompli',
    minXp: 750,
    tagline: 'Grands bâtiments, écosystème complet. Tu as construit ton parcours.',
    scene: 'ecosystem',
    visualTier: 'advanced',
    accent: '#fbbf24',
  },
];

export const CITY_BUILDINGS: CityBuildingDef[] = [
  {
    id: 'foundation',
    name: 'Fondations',
    description: 'Quiz entrepreneurial complété. Les bases sont posées.',
    icon: '🏠',
    slot: { x: 22, y: 56 },
  },
  {
    id: 'coach_desk',
    name: 'Bureau coach',
    description: 'Premier échange avec le coach IA.',
    icon: '💼',
    slot: { x: 36, y: 52 },
  },
  {
    id: 'roadmap_tower',
    name: 'Tour du plan',
    description: '25 % de ton parcours jour par jour complété.',
    icon: '🗼',
    slot: { x: 78, y: 42 },
  },
  {
    id: 'streak_plaza',
    name: 'Place régularité',
    description: '3 jours consécutifs d\'activité dans l\'app.',
    icon: '🔥',
    slot: { x: 82, y: 58 },
  },
  {
    id: 'coach_hq',
    name: 'Siège coaching',
    description: '10 messages échangés. Tu avances avec constance.',
    icon: '🏢',
    slot: { x: 64, y: 48 },
    scale: 1.1,
  },
  {
    id: 'roadmap_campus',
    name: 'Campus croissance',
    description: '50 % du parcours complété. La moitié du chemin est derrière toi.',
    icon: '🏛️',
    slot: { x: 68, y: 34 },
    scale: 1.15,
  },
  {
    id: 'discipline_monument',
    name: 'Monument discipline',
    description: '7 jours consécutifs. La régularité devient un avantage.',
    icon: '⏱️',
    slot: { x: 12, y: 44 },
  },
  {
    id: 'innovation_lab',
    name: 'Lab innovation',
    description: '25 messages coach. Tu expérimentez et itérez.',
    icon: '🔬',
    slot: { x: 58, y: 38 },
  },
  {
    id: 'weekly_observatory',
    name: 'Observatoire',
    description: 'Première analyse hebdomadaire générée.',
    icon: '🔭',
    slot: { x: 48, y: 30 },
  },
  {
    id: 'roadmap_arch',
    name: 'Arche du parcours',
    description: '100 % du parcours débloqué complété. Étape majeure.',
    icon: '🏆',
    slot: { x: 88, y: 36 },
    scale: 1.2,
  },
  {
    id: 'premium_hq',
    name: 'QG BuildrAI',
    description: 'Abonnement actif. Tu investis dans ta progression.',
    icon: '◈',
    slot: { x: 28, y: 68 },
  },
  {
    id: 'business_district',
    name: 'Quartier général',
    description: 'Phase avancée du coaching. Ton business se structure.',
    icon: '🌆',
    slot: { x: 50, y: 16 },
    scale: 1.25,
  },
];

export const CITY_XP = {
  welcomeBonus: 100,
  quiz: 50,
  perCoachMessage: 12,
  perCoachSession: 6,
  perRoadmapDay: 8,
  streak3: 30,
  streak7: 60,
  perWeeklyAnalysis: 40,
  perCoachingPhase: 25,
} as const;

export const COACH_CITY_HINTS = [
  'Chaque action concrète fait grandir ton quartier : marché, offre, landing, prospection.',
  'Ton empire visuel reflète tes étapes business, pas des points abstraits.',
  'Une zone de plus = une compétence ou un livrable de plus dans ton projet.',
  'La régularité se voit ici comme en business : petits pas, gros résultats.',
] as const;
