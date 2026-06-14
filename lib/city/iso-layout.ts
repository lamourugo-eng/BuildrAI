export type IsoBuildingVariant =
  | 'hq'
  | 'office'
  | 'tower'
  | 'campus'
  | 'plaza'
  | 'monument'
  | 'dome'
  | 'arch'
  | 'lab'
  | 'skyline';

export interface IsoGridSlot {
  gx: number;
  gy: number;
  height: number;
  variant: IsoBuildingVariant;
}

/** Bâtiments sur parcelles (coords impaires). Routes sur lignes paires */
export const ISO_BUILDING_GRID: Record<string, IsoGridSlot> = {
  foundation: { gx: 5, gy: 5, height: 2, variant: 'hq' },
  coach_desk: { gx: 3, gy: 7, height: 1, variant: 'office' },
  premium_hq: { gx: 3, gy: 5, height: 2, variant: 'hq' },
  coach_hq: { gx: 7, gy: 5, height: 2, variant: 'office' },
  innovation_lab: { gx: 7, gy: 3, height: 3, variant: 'lab' },
  roadmap_campus: { gx: 7, gy: 7, height: 2, variant: 'campus' },
  weekly_observatory: { gx: 3, gy: 3, height: 2, variant: 'dome' },
  discipline_monument: { gx: 1, gy: 5, height: 2, variant: 'monument' },
  roadmap_tower: { gx: 9, gy: 3, height: 3, variant: 'tower' },
  streak_plaza: { gx: 9, gy: 7, height: 1, variant: 'plaza' },
  roadmap_arch: { gx: 9, gy: 1, height: 2, variant: 'arch' },
  business_district: { gx: 5, gy: 1, height: 4, variant: 'skyline' },
};

export const ISO_HERO = { gx: 5, gy: 8 };
export const ISO_GRID_SIZE = 10;

const TILE_W = 46;
const TILE_H = 23;
const COMPACT_SCALE = 0.608696; // 28/46. Aligné sur .iso-tile en mode compact

/** Décalage vertical pour poser la base du bâtiment sur la tuile (centre → surface). */
export const ISO_BUILDING_GROUND_OFFSET = {
  full: 14,
  compact: 9,
} as const;

export interface IsoScreenPos {
  x: number;
  y: number;
  zIndex: number;
}

export function gridToScreen(gx: number, gy: number, compact = false): IsoScreenPos {
  const scale = compact ? COMPACT_SCALE : 1;
  const w = TILE_W * scale;
  const h = TILE_H * scale;
  const yOffset = compact ? -6 : -22;

  return {
    x: (gx - gy) * (w / 2),
    y: (gx + gy) * (h / 2) + yOffset,
    zIndex: Math.round(gx + gy),
  };
}

export function getBuildingGroundOffset(compact = false): number {
  return compact ? ISO_BUILDING_GROUND_OFFSET.compact : ISO_BUILDING_GROUND_OFFSET.full;
}

export function getIsoSlot(buildingId: string): IsoGridSlot {
  return (
    ISO_BUILDING_GRID[buildingId] ?? {
      gx: 5,
      gy: 5,
      height: 1,
      variant: 'office',
    }
  );
}

export function generateGridTiles(size = ISO_GRID_SIZE) {
  const tiles: { gx: number; gy: number; key: string }[] = [];
  for (let gy = 0; gy < size; gy++) {
    for (let gx = 0; gx < size; gx++) {
      tiles.push({ gx, gy, key: `${gx}-${gy}` });
    }
  }
  return tiles.sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
}

export function isNearUnlockedBuilding(gx: number, gy: number, unlockedIds: Set<string>): boolean {
  for (const [id, slot] of Object.entries(ISO_BUILDING_GRID)) {
    if (!unlockedIds.has(id)) continue;
    if (Math.abs(slot.gx - gx) <= 1 && Math.abs(slot.gy - gy) <= 1) return true;
  }
  return Math.abs(gx - ISO_HERO.gx) <= 1 && Math.abs(gy - ISO_HERO.gy) <= 1;
}
