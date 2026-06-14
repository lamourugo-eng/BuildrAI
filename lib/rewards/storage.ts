export const REWARDS_KEY = 'buildrai_rewards';

export interface RewardsStorageData {
  welcomeBonusClaimed: boolean;
  lastSeenBadgeIds: string[];
}

function defaultRewards(): RewardsStorageData {
  return {
    welcomeBonusClaimed: false,
    lastSeenBadgeIds: [],
  };
}

export function loadRewardsStorage(): RewardsStorageData {
  if (typeof window === 'undefined') return defaultRewards();
  try {
    const raw = localStorage.getItem(REWARDS_KEY);
    if (!raw) return defaultRewards();
    return { ...defaultRewards(), ...JSON.parse(raw) };
  } catch {
    return defaultRewards();
  }
}

function saveRewards(data: RewardsStorageData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REWARDS_KEY, JSON.stringify(data));
}

export function claimWelcomeBonus(): boolean {
  const data = loadRewardsStorage();
  if (data.welcomeBonusClaimed) return false;
  data.welcomeBonusClaimed = true;
  saveRewards(data);
  return true;
}

export function markBadgesSeen(badgeIds: string[]) {
  const data = loadRewardsStorage();
  data.lastSeenBadgeIds = badgeIds;
  saveRewards(data);
}

export function getNewBadgeIds(currentUnlockedIds: string[]): string[] {
  const data = loadRewardsStorage();
  return currentUnlockedIds.filter((id) => !data.lastSeenBadgeIds.includes(id));
}
