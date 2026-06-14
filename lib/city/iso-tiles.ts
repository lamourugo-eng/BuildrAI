import { ISO_BUILDING_GRID, ISO_HERO, ISO_GRID_SIZE } from './iso-layout';

/** Variante de tuile sol */
export type IsoTileVariant = 'grass' | 'road' | 'crosswalk' | 'ghost';

function tileKey(gx: number, gy: number) {
  return `${gx}-${gy}`;
}

function isBuildingTile(gx: number, gy: number): boolean {
  return Object.values(ISO_BUILDING_GRID).some((s) => s.gx === gx && s.gy === gy);
}

function buildRoadNetwork(): { roads: Set<string>; crosswalks: Set<string> } {
  const roads = new Set<string>();
  const crosswalks = new Set<string>();

  const canRoad = (gx: number, gy: number) =>
    gx >= 0 &&
    gy >= 0 &&
    gx < ISO_GRID_SIZE &&
    gy < ISO_GRID_SIZE &&
    !isBuildingTile(gx, gy);

  const addRoad = (gx: number, gy: number) => {
    if (canRoad(gx, gy)) roads.add(tileKey(gx, gy));
  };

  const drawLine = (x0: number, y0: number, x1: number, y1: number) => {
    if (x0 === x1) {
      const [ya, yb] = y0 < y1 ? [y0, y1] : [y1, y0];
      for (let y = ya; y <= yb; y++) addRoad(x0, y);
      return;
    }
    if (y0 === y1) {
      const [xa, xb] = x0 < x1 ? [x0, x1] : [x1, x0];
      for (let x = xa; x <= xb; x++) addRoad(x, y0);
    }
  };

  const columnClear = (gx: number, y0: number, y1: number) => {
    const [ya, yb] = y0 < y1 ? [y0, y1] : [y1, y0];
    for (let y = ya; y <= yb; y++) {
      if (isBuildingTile(gx, y)) return false;
    }
    return true;
  };

  /** Relie un point au réseau sans laisser de trou (contourne les bâtiments) */
  const connectToNetwork = (gx: number, gy: number) => {
    if (gy === 6 && roads.has(tileKey(gx, gy))) return;

    if (columnClear(gx, gy, 6)) {
      drawLine(gx, gy, gx, 6);
      return;
    }

    for (const dx of [-1, 1, -2, 2]) {
      const via = gx + dx;
      if (via < 0 || via >= ISO_GRID_SIZE) continue;
      if (!canRoad(via, gy)) continue;
      if (!columnClear(via, gy, 6)) continue;

      drawLine(gx, gy, via, gy);
      drawLine(via, gy, via, 6);
      return;
    }
  };

  // Artère principale. Colonne vertébrale du réseau
  drawLine(0, 6, ISO_GRID_SIZE - 1, 6);

  const destinations = [
    ...Object.values(ISO_BUILDING_GRID).map((s) => ({ gx: s.gx, gy: s.gy })),
    ISO_HERO,
  ];

  for (const dest of destinations) {
    const accessCandidates = [
      { gx: dest.gx - 1, gy: dest.gy },
      { gx: dest.gx + 1, gy: dest.gy },
      { gx: dest.gx, gy: dest.gy - 1 },
      { gx: dest.gx, gy: dest.gy + 1 },
    ]
      .filter((p) => canRoad(p.gx, p.gy))
      .sort(
        (a, b) =>
          Math.abs(a.gy - 6) + Math.abs(a.gx - 5) * 0.25 -
          (Math.abs(b.gy - 6) + Math.abs(b.gx - 5) * 0.25)
      );

    const access = accessCandidates[0];
    if (!access) continue;

    addRoad(access.gx, access.gy);
    connectToNetwork(access.gx, access.gy);

    // Prolonger jusqu'au héros si la case est praticable
    if (canRoad(dest.gx, dest.gy)) {
      drawLine(access.gx, access.gy, dest.gx, dest.gy);
    }
  }

  // Carrefours marqués
  for (const [gx, gy] of [
    [2, 6],
    [5, 6],
    [8, 6],
  ] as const) {
    const key = tileKey(gx, gy);
    if (roads.has(key)) crosswalks.add(key);
  }

  return { roads, crosswalks };
}

const { roads: ROAD_TILES, crosswalks: CROSSWALK_TILES } = buildRoadNetwork();

export function isRoadTile(gx: number, gy: number): boolean {
  const key = tileKey(gx, gy);
  return ROAD_TILES.has(key) || CROSSWALK_TILES.has(key);
}

export function isGrassTile(gx: number, gy: number): boolean {
  if (isBuildingTile(gx, gy)) return false;
  if (gx === ISO_HERO.gx && gy === ISO_HERO.gy) return false;
  return !isRoadTile(gx, gy);
}

export function getTileVariant(
  gx: number,
  gy: number,
  _hero: { gx: number; gy: number }
): IsoTileVariant {
  const key = tileKey(gx, gy);
  if (CROSSWALK_TILES.has(key)) return 'crosswalk';
  if (ROAD_TILES.has(key)) return 'road';
  return 'grass';
}

/** Trottoirs désactivés */
export function isSidewalkTile(
  _gx: number,
  _gy: number,
  _hero: { gx: number; gy: number }
): boolean {
  return false;
}
