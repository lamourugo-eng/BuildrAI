import type { CityLevel } from '@/lib/city/data';
import {
  PROFILE_COLORS,
  type EntrepreneurProfile,
  type FounderAccessory,
  type FounderAvatar,
  type FounderGender,
  type FounderLook,
  type FounderOutfit,
} from '@/lib/city/avatar-data';

export type VisualTier = CityLevel['visualTier'];
export type OutfitTier = 'starter' | 'growth' | 'founder';

export interface EffectiveAvatarAppearance {
  name: string;
  gender: FounderGender;
  outfit: FounderOutfit;
  accessory: FounderAccessory;
  look: FounderLook;
  profile: EntrepreneurProfile;
  visualTier: VisualTier;
  outfitTier: OutfitTier;
  levelId: number;
  colors: { primary: string; secondary: string; accent: string; skin: string };
  hair: { base: string; mid: string; highlight: string; shadow: string };
  laptopSize: 'small' | 'medium' | 'large';
  showFounderBadge: boolean;
  evolutionLabel: string;
}

const EVOLUTION_LABELS: Record<OutfitTier, string> = {
  starter: 'Entrepreneur débutant. Vêtements simples, petit setup',
  growth: 'En croissance. Meilleure tenue, setup amélioré',
  founder: 'Fondateur accompli. Look premium, grand bureau',
};

function outfitTierFromVisual(visualTier: VisualTier, levelId: number): OutfitTier {
  if (visualTier === 'advanced' || levelId >= 4) return 'founder';
  if (visualTier === 'intermediate' || levelId >= 3) return 'growth';
  return 'starter';
}

function resolveOutfit(base: FounderOutfit, tier: OutfitTier): FounderOutfit {
  if (tier === 'founder') {
    if (base === 'casual' || base === 'hoodie') return 'smart';
    return base === 'blazer' ? 'smart' : base;
  }
  if (tier === 'growth') {
    if (base === 'casual') return 'blazer';
    if (base === 'hoodie') return 'hoodie';
    return base;
  }
  return base === 'smart' ? 'blazer' : base;
}

function resolveAccessory(
  base: FounderAccessory,
  tier: OutfitTier
): FounderAccessory {
  if (base === 'none' && tier !== 'starter') return 'laptop';
  return base;
}

function adjustColorsForLook(
  colors: { primary: string; secondary: string; accent: string },
  look: FounderLook
): { primary: string; secondary: string; accent: string; skin: string } {
  const skin = look === 'bold' ? '#f5c99a' : look === 'minimal' ? '#e8dcc8' : '#fcd9b6';
  switch (look) {
    case 'minimal':
      return {
        primary: '#64748b',
        secondary: '#475569',
        accent: '#94a3b8',
        skin,
      };
    case 'bold':
      return {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        skin,
      };
    case 'startup':
      return {
        primary: colors.primary,
        secondary: '#0f172a',
        accent: colors.accent,
        skin,
      };
    case 'classic':
    default:
      return { ...colors, skin };
  }
}

function getHairPalette(
  look: FounderLook,
  gender: FounderGender
): EffectiveAvatarAppearance['hair'] {
  if (look === 'minimal') {
    return { base: '#64748b', mid: '#94a3b8', highlight: '#cbd5e1', shadow: '#334155' };
  }
  if (look === 'bold') {
    return { base: '#7c2d12', mid: '#c2410c', highlight: '#fdba74', shadow: '#431407' };
  }
  if (look === 'startup') {
    return { base: '#1e293b', mid: '#334155', highlight: '#64748b', shadow: '#0f172a' };
  }
  if (gender === 'woman') {
    return { base: '#A88B8B', mid: '#B89A9A', highlight: '#CDB4B4', shadow: '#4A3232' };
  }
  if (gender === 'man') {
    return { base: '#8B6040', mid: '#A07050', highlight: '#D4A870', shadow: '#4A3020' };
  }
  return { base: '#967050', mid: '#AD8460', highlight: '#DDB890', shadow: '#5A3828' };
}

function buildAppearance(
  avatar: FounderAvatar,
  visualTier: VisualTier,
  levelId: number,
  outfitTier: OutfitTier,
  options: {
    outfit: FounderOutfit;
    accessory: FounderAccessory;
    showFounderBadge: boolean;
    evolutionLabel: string;
  }
): EffectiveAvatarAppearance {
  const baseColors = PROFILE_COLORS[avatar.profile];
  const colors = adjustColorsForLook(baseColors, avatar.look);
  const hair = getHairPalette(avatar.look, avatar.gender);
  const laptopSize: EffectiveAvatarAppearance['laptopSize'] =
    outfitTier === 'founder' ? 'large' : outfitTier === 'growth' ? 'medium' : 'small';

  return {
    name: avatar.name,
    gender: avatar.gender,
    outfit: options.outfit,
    accessory: options.accessory,
    look: avatar.look,
    profile: avatar.profile,
    visualTier,
    outfitTier,
    levelId,
    colors,
    hair,
    laptopSize,
    showFounderBadge: options.showFounderBadge,
    evolutionLabel: options.evolutionLabel,
  };
}

export function getEffectiveAvatarAppearance(
  avatar: FounderAvatar,
  visualTier: VisualTier,
  levelId: number
): EffectiveAvatarAppearance {
  const outfitTier = outfitTierFromVisual(visualTier, levelId);
  return buildAppearance(avatar, visualTier, levelId, outfitTier, {
    outfit: resolveOutfit(avatar.outfit, outfitTier),
    accessory: resolveAccessory(avatar.accessory, outfitTier),
    showFounderBadge: outfitTier === 'founder',
    evolutionLabel: EVOLUTION_LABELS[outfitTier],
  });
}

/** Aperçu customizer. Affiche les choix bruts sans évolution automatique */
export function getCustomizerPreviewAppearance(
  avatar: FounderAvatar,
  levelId: number
): EffectiveAvatarAppearance {
  const visualTier: VisualTier =
    levelId >= 4 ? 'advanced' : levelId >= 3 ? 'intermediate' : 'beginner';
  const outfitTier = outfitTierFromVisual(visualTier, levelId);
  return buildAppearance(avatar, visualTier, levelId, outfitTier, {
    outfit: avatar.outfit,
    accessory: avatar.accessory,
    showFounderBadge: false,
    evolutionLabel: 'Aperçu de tes choix actuels',
  });
}
