import type { FounderStyle } from '@/lib/city/data';
import {
  createDefaultAvatarDraft,
  isCompleteAvatar,
  profileFromBusinessId,
  type EntrepreneurProfile,
  type FounderAvatar,
} from '@/lib/city/avatar-data';

export const CITY_KEY = 'buildrai_city';
const LEGACY_REWARDS_KEY = 'buildrai_rewards';

/** @deprecated Legacy field. Use profile instead */
interface LegacyFounderAvatar {
  style: FounderStyle;
  name: string;
  createdAt: string;
}

export interface CityStorageData {
  avatar: FounderAvatar | null;
  welcomeBonusClaimed: boolean;
  lastSeenBuildingIds: string[];
}

function defaultCity(): CityStorageData {
  return {
    avatar: null,
    welcomeBonusClaimed: false,
    lastSeenBuildingIds: [],
  };
}

const STYLE_TO_PROFILE: Record<FounderStyle, EntrepreneurProfile> = {
  builder: 'tech',
  strategist: 'consultant',
  creative: 'creator',
  connector: 'freelance',
};

function migrateLegacyAvatar(legacy: LegacyFounderAvatar): FounderAvatar {
  const draft = createDefaultAvatarDraft(
    legacy.name || 'Fondateur',
    STYLE_TO_PROFILE[legacy.style] ?? 'tech'
  );
  return {
    ...draft,
    createdAt: legacy.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeAvatar(raw: unknown): FounderAvatar | null {
  if (!raw || typeof raw !== 'object') return null;

  const legacy = raw as Partial<LegacyFounderAvatar>;
  if (legacy.style && legacy.name) {
    return migrateLegacyAvatar(legacy as LegacyFounderAvatar);
  }

  const a = raw as Partial<FounderAvatar & { hairstyle?: string }>;
  if (
    a.name &&
    a.gender &&
    a.outfit &&
    a.accessory &&
    a.look &&
    a.profile &&
    a.createdAt
  ) {
    const { hairstyle: _h, ...rest } = a as Partial<FounderAvatar & { hairstyle?: string }>;
    return { ...rest, name: rest.name || 'Fondateur', gender: 'neutral' } as FounderAvatar;
  }

  return null;
}

function migrateLegacyWelcome(data: CityStorageData): CityStorageData {
  if (data.welcomeBonusClaimed || typeof window === 'undefined') return data;
  try {
    const raw = localStorage.getItem(LEGACY_REWARDS_KEY);
    if (!raw) return data;
    const legacy = JSON.parse(raw) as { welcomeBonusClaimed?: boolean };
    if (legacy.welcomeBonusClaimed) {
      return { ...data, welcomeBonusClaimed: true };
    }
  } catch {
    /* ignore */
  }
  return data;
}

export function loadCityStorage(): CityStorageData {
  if (typeof window === 'undefined') return defaultCity();
  try {
    const raw = localStorage.getItem(CITY_KEY);
    if (!raw) return migrateLegacyWelcome(defaultCity());
    const parsed = JSON.parse(raw) as Partial<CityStorageData>;
    return migrateLegacyWelcome({
      ...defaultCity(),
      ...parsed,
      avatar: normalizeAvatar(parsed.avatar),
    });
  } catch {
    return defaultCity();
  }
}

function saveCity(data: CityStorageData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CITY_KEY, JSON.stringify(data));
}

export function loadFounderAvatar(): FounderAvatar | null {
  return loadCityStorage().avatar;
}

export function saveFounderAvatar(avatar: FounderAvatar) {
  const data = loadCityStorage();
  data.avatar = {
    ...avatar,
    updatedAt: new Date().toISOString(),
  };
  saveCity(data);
}

export function hasFounderAvatar(): boolean {
  return isCompleteAvatar(loadCityStorage().avatar);
}

/** @deprecated Prefer explicit avatar creation via FounderCustomizer */
export function ensureFounderAvatar(defaultName = 'Fondateur'): FounderAvatar | null {
  const data = loadCityStorage();
  if (data.avatar) return data.avatar;
  return null;
}

export function claimCityWelcomeBonus(): boolean {
  const data = loadCityStorage();
  if (data.welcomeBonusClaimed) return false;
  data.welcomeBonusClaimed = true;
  saveCity(data);
  return true;
}

export function markBuildingsSeen(buildingIds: string[]) {
  const data = loadCityStorage();
  data.lastSeenBuildingIds = buildingIds;
  saveCity(data);
}

export function getNewBuildingIds(unlockedIds: string[]): string[] {
  const data = loadCityStorage();
  return unlockedIds.filter((id) => !data.lastSeenBuildingIds.includes(id));
}

export { profileFromBusinessId, createDefaultAvatarDraft, isCompleteAvatar };
