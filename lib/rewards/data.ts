export interface RewardTier {
  id: string;
  name: string;
  minPoints: number;
  color: string;
}

export interface RewardBadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const REWARD_TIERS: RewardTier[] = [
  { id: 'explorer', name: 'Explorateur', minPoints: 0, color: '#94a3b8' },
  { id: 'builder', name: 'Builder', minPoints: 100, color: '#60a5fa' },
  { id: 'stratege', name: 'Stratège', minPoints: 300, color: '#a78bfa' },
  { id: 'fondateur', name: 'Fondateur', minPoints: 600, color: '#fbbf24' },
];

export const REWARD_BADGES: RewardBadgeDef[] = [
  {
    id: 'premium',
    name: 'Membre Premium',
    description: 'Abonnement BuildrAI actif',
    icon: '👑',
  },
  {
    id: 'quiz',
    name: 'Profil découvert',
    description: 'Quiz entrepreneurial complété',
    icon: '🎯',
  },
  {
    id: 'first_chat',
    name: 'Premier échange',
    description: 'Premier message envoyé au coach',
    icon: '💬',
  },
  {
    id: 'coach_10',
    name: 'Coach régulier',
    description: '10 messages échangés avec le coach',
    icon: '🔥',
  },
  {
    id: 'coach_25',
    name: 'Coach engagé',
    description: '25 messages échangés avec le coach',
    icon: '⚡',
  },
  {
    id: 'streak_3',
    name: 'Régularité',
    description: '3 jours consécutifs d\'activité',
    icon: '📅',
  },
  {
    id: 'streak_7',
    name: 'Discipline',
    description: '7 jours consécutifs d\'activité',
    icon: '🏆',
  },
  {
    id: 'plan_half',
    name: 'Mi-parcours',
    description: '50 % de progression sur votre plan',
    icon: '📈',
  },
  {
    id: 'plan_complete',
    name: 'Plan maîtrisé',
    description: '100 % de progression sur votre plan',
    icon: '✅',
  },
];

export const WELCOME_BONUS_POINTS = 100;
export const QUIZ_BONUS_POINTS = 50;
export const POINTS_PER_MESSAGE = 10;
export const POINTS_PER_SESSION = 5;
export const STREAK_3_BONUS = 25;
export const STREAK_7_BONUS = 50;
