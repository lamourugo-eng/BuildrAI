'use client';

import { gridToScreen } from '@/lib/city/iso-layout';
import { isGrassTile } from '@/lib/city/iso-tiles';

interface IsoAmbienceProps {
  compact?: boolean;
  tier: 'beginner' | 'intermediate' | 'advanced';
  unlockedCount: number;
}

function IsoTree({ x, y, z, compact }: { x: number; y: number; z: number; compact?: boolean }) {
  return (
    <div
      className={`iso-prop iso-prop--tree${compact ? ' iso-prop--compact' : ''}`}
      style={{ left: x, top: y, zIndex: z }}
      aria-hidden="true"
    >
      <span className="iso-tree-foliage" />
      <span className="iso-tree-trunk" />
    </div>
  );
}

function IsoLamp({ x, y, z, compact }: { x: number; y: number; z: number; compact?: boolean }) {
  return (
    <div
      className={`iso-prop iso-prop--lamp${compact ? ' iso-prop--compact' : ''}`}
      style={{ left: x, top: y, zIndex: z }}
      aria-hidden="true"
    >
      <span className="iso-lamp-glow" />
      <span className="iso-lamp-arm" />
      <span className="iso-lamp-head" />
      <span className="iso-lamp-pole" />
    </div>
  );
}

/** Emplacements végétation. Uniquement sur herbe, jamais sur route */
const TREE_SLOTS = [
  { gx: 2, gy: 4 },
  { gx: 6, gy: 4 },
  { gx: 2, gy: 8 },
  { gx: 8, gy: 8 },
  { gx: 1, gy: 3 },
  { gx: 8, gy: 2 },
];

const LAMP_SLOTS = [
  { gx: 4, gy: 3 },
  { gx: 6, gy: 8 },
  { gx: 3, gy: 4 },
  { gx: 8, gy: 4 },
];

/** Arbres et lampadaires sur parcelles herbe uniquement */
export default function IsoAmbience({ compact = false, tier, unlockedCount }: IsoAmbienceProps) {
  if (unlockedCount < 1) return null;

  const p = (gx: number, gy: number) => gridToScreen(gx, gy, compact);
  const trees = TREE_SLOTS.filter((s) => isGrassTile(s.gx, s.gy));
  const lamps = LAMP_SLOTS.filter((s) => isGrassTile(s.gx, s.gy));

  return (
    <>
      {trees.slice(0, tier === 'beginner' ? 2 : tier === 'intermediate' ? 4 : 6).map((s, i) => (
        <IsoTree key={`tree-${s.gx}-${s.gy}`} {...p(s.gx, s.gy)} z={8 + i} compact={compact} />
      ))}
      {lamps.slice(0, tier === 'beginner' ? 1 : tier === 'intermediate' ? 2 : 4).map((s, i) => (
        <IsoLamp key={`lamp-${s.gx}-${s.gy}`} {...p(s.gx, s.gy)} z={12 + i} compact={compact} />
      ))}
    </>
  );
}
