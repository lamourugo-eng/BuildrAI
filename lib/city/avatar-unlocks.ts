import { CITY_LEVELS } from '@/lib/city/data';
import {
  FOUNDER_ACCESSORIES,
  FOUNDER_LOOKS,
  FOUNDER_OUTFITS,
  type FounderAccessory,
  type FounderAvatar,
  type FounderLook,
  type FounderOutfit,
} from '@/lib/city/avatar-data';

export type AppearanceCategory = 'outfit' | 'accessory' | 'look';

/** Niveau minimum pour débloquer une option (1 = disponible dès le départ) */
export const APPEARANCE_MIN_LEVEL: Record<
  AppearanceCategory,
  Partial<Record<string, number>>
> = {
  outfit: {
    blazer: 3,
    smart: 5,
  },
  accessory: {
    coffee: 2,
    glasses: 3,
    tablet: 4,
  },
  look: {
    startup: 3,
    bold: 4,
  },
};

const CATEGORY_OPTIONS: Record<
  AppearanceCategory,
  readonly { id: string; label: string }[]
> = {
  outfit: FOUNDER_OUTFITS,
  accessory: FOUNDER_ACCESSORIES,
  look: FOUNDER_LOOKS,
};

export function getAppearanceMinLevel(
  category: AppearanceCategory,
  optionId: string
): number {
  return APPEARANCE_MIN_LEVEL[category]?.[optionId] ?? 1;
}

export function isAppearanceUnlocked(
  category: AppearanceCategory,
  optionId: string,
  playerLevelId: number
): boolean {
  return playerLevelId >= getAppearanceMinLevel(category, optionId);
}

export function getUnlockLevelName(levelId: number): string {
  return CITY_LEVELS.find((l) => l.id === levelId)?.name ?? `Niv. ${levelId}`;
}

function firstUnlockedOption<T extends string>(
  category: AppearanceCategory,
  playerLevelId: number
): T {
  const match = CATEGORY_OPTIONS[category].find((opt) =>
    isAppearanceUnlocked(category, opt.id, playerLevelId)
  );
  return (match?.id ?? CATEGORY_OPTIONS[category][0]?.id) as T;
}

export function getEffectiveAppearanceValue<T extends string>(
  category: AppearanceCategory,
  value: T,
  playerLevelId: number
): T {
  if (isAppearanceUnlocked(category, value, playerLevelId)) return value;
  return firstUnlockedOption<T>(category, playerLevelId);
}

function sanitizeField<T extends string>(
  category: AppearanceCategory,
  value: T,
  playerLevelId: number
): T {
  if (isAppearanceUnlocked(category, value, playerLevelId)) return value;
  return firstUnlockedOption<T>(category, playerLevelId);
}

/** Remplace les options verrouillées par la première option disponible */
export function sanitizeAvatarForLevel(
  avatar: FounderAvatar,
  playerLevelId: number
): FounderAvatar {
  return {
    ...avatar,
    outfit: sanitizeField<FounderOutfit>('outfit', avatar.outfit, playerLevelId),
    accessory: sanitizeField<FounderAccessory>(
      'accessory',
      avatar.accessory,
      playerLevelId
    ),
    look: sanitizeField<FounderLook>('look', avatar.look, playerLevelId),
  };
}

/** Options avancées encore verrouillées pour ce niveau */
export function getLockedAppearancePreview(playerLevelId: number): string[] {
  const locked: string[] = [];

  for (const [category, thresholds] of Object.entries(APPEARANCE_MIN_LEVEL) as [
    AppearanceCategory,
    Partial<Record<string, number>>,
  ][]) {
    for (const [optionId, minLevel] of Object.entries(thresholds)) {
      if (minLevel === undefined || playerLevelId >= minLevel) continue;
      const label =
        CATEGORY_OPTIONS[category].find((o) => o.id === optionId)?.label ?? optionId;
      locked.push(`${label}. ${getUnlockLevelName(minLevel)}`);
    }
  }

  return locked;
}
