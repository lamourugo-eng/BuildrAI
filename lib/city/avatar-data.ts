import type { BusinessId } from '@/lib/quiz/data';

export type FounderGender = 'man' | 'woman' | 'neutral';
export type FounderOutfit = 'casual' | 'hoodie' | 'blazer' | 'smart';
export type FounderAccessory = 'none' | 'laptop' | 'glasses' | 'coffee' | 'tablet';
export type FounderLook = 'minimal' | 'classic' | 'bold' | 'startup';
export type EntrepreneurProfile =
  | 'tech'
  | 'freelance'
  | 'creator'
  | 'ecommerce'
  | 'consultant';

export interface FounderAvatar {
  name: string;
  gender: FounderGender;
  outfit: FounderOutfit;
  accessory: FounderAccessory;
  look: FounderLook;
  profile: EntrepreneurProfile;
  createdAt: string;
  updatedAt?: string;
}

export interface OptionDef<T extends string> {
  id: T;
  label: string;
  desc?: string;
  emoji?: string;
}

export const FOUNDER_OUTFITS: OptionDef<FounderOutfit>[] = [
  { id: 'casual', label: 'Décontracté', desc: 'T-shirt simple' },
  { id: 'hoodie', label: 'Hoodie', desc: 'Mode builder' },
  { id: 'blazer', label: 'Blazer', desc: 'Pro mais accessible' },
  { id: 'smart', label: 'Costume', desc: 'Fondateur en mode sérieux' },
];

export const FOUNDER_ACCESSORIES: OptionDef<FounderAccessory>[] = [
  { id: 'none', label: 'Aucun', emoji: '—' },
  { id: 'laptop', label: 'Ordinateur', emoji: '💻', desc: 'Setup de départ' },
  { id: 'glasses', label: 'Lunettes', emoji: '👓', desc: 'Vision stratégique' },
  { id: 'coffee', label: 'Café', emoji: '☕', desc: 'Longues sessions' },
  { id: 'tablet', label: 'Tablette', emoji: '📱', desc: 'Mobile & agile' },
];

export const FOUNDER_LOOKS: OptionDef<FounderLook>[] = [
  { id: 'minimal', label: 'Minimal', desc: 'Sobre et épuré' },
  { id: 'classic', label: 'Classique', desc: 'Équilibré et pro' },
  { id: 'bold', label: 'Audacieux', desc: 'Couleurs marquées' },
  { id: 'startup', label: 'Startup', desc: 'Esprit tech moderne' },
];

export const ENTREPRENEUR_PROFILES: OptionDef<EntrepreneurProfile>[] = [
  {
    id: 'tech',
    label: 'Entrepreneur tech',
    emoji: '⚡',
    desc: 'SaaS, apps, produits digitaux',
  },
  {
    id: 'freelance',
    label: 'Freelance',
    emoji: '🎯',
    desc: 'Services, missions, indépendance',
  },
  {
    id: 'creator',
    label: 'Créateur de contenu',
    emoji: '✨',
    desc: 'Audience, contenu, influence',
  },
  {
    id: 'ecommerce',
    label: 'E-commerce',
    emoji: '🛒',
    desc: 'Boutique, produits, ventes en ligne',
  },
  {
    id: 'consultant',
    label: 'Consultant',
    emoji: '📊',
    desc: 'Conseil, expertise, accompagnement',
  },
];

export const PROFILE_COLORS: Record<
  EntrepreneurProfile,
  { primary: string; secondary: string; accent: string }
> = {
  tech: { primary: '#3b82f6', secondary: '#1e3a5f', accent: '#60a5fa' },
  freelance: { primary: '#14b8a6', secondary: '#134e4a', accent: '#2dd4bf' },
  creator: { primary: '#ec4899', secondary: '#5c1a3d', accent: '#f472b6' },
  ecommerce: { primary: '#f97316', secondary: '#7c2d12', accent: '#fb923c' },
  consultant: { primary: '#8b5cf6', secondary: '#3b2764', accent: '#a78bfa' },
};

export function createDefaultAvatarDraft(
  name = 'Fondateur',
  profile: EntrepreneurProfile = 'tech'
): FounderAvatar {
  return {
    name,
    gender: 'neutral',
    outfit: 'casual',
    accessory: 'laptop',
    look: 'classic',
    profile,
    createdAt: new Date().toISOString(),
  };
}

export function profileFromBusinessId(businessId: BusinessId): EntrepreneurProfile {
  switch (businessId) {
    case 'saas':
    case 'marketplace':
      return 'tech';
    case 'freelance':
      return 'freelance';
    case 'ecommerce':
      return 'ecommerce';
    case 'agency':
      return 'consultant';
    default:
      return 'tech';
  }
}

export function isCompleteAvatar(avatar: unknown): avatar is FounderAvatar {
  if (!avatar || typeof avatar !== 'object') return false;
  const a = avatar as Partial<FounderAvatar>;
  return Boolean(
    a.name &&
      a.gender &&
      a.outfit &&
      a.accessory &&
      a.look &&
      a.profile &&
      a.createdAt
  );
}
