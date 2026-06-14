import type { ReactNode } from 'react';
import type { IsoBuildingVariant } from '@/lib/city/iso-layout';

interface IsoBuildingArtProps {
  variant: IsoBuildingVariant;
  buildingId: string;
  height: number;
}

const C = {
  glassL: '#5a9fd4',
  glassM: '#3a7ab8',
  glassD: '#1e5080',
  glassR: '#7ec0ef',
  concreteL: '#e8e0d4',
  concreteM: '#c8beb0',
  concreteD: '#a89888',
  stoneL: '#d4c8b8',
  stoneD: '#9a8878',
  roof: '#b0a898',
  shadow: 'rgba(30,40,55,0.22)',
  shadowSoft: 'rgba(30,40,55,0.12)',
  green: '#5daa50',
};

/** Ligne de sol dans le viewBox (y du bas de la tuile / ombre). */
const GROUND = {
  y100: 96,
  y110: 104,
  y88: 84,
  y72: 68,
} as const;

function GroundShadow({ cx, cy, w = 36 }: { cx: number; cy: number; w?: number }) {
  return <ellipse cx={cx} cy={cy} rx={w} ry={5} fill={C.shadow} />;
}

function IsoPrism({
  cx,
  cy,
  hw,
  hd,
  h,
  top,
  left,
  right,
  children,
}: {
  cx: number;
  cy: number;
  hw: number;
  hd: number;
  h: number;
  top: string;
  left: string;
  right: string;
  children?: ReactNode;
}) {
  const topPath = `M${cx} ${cy - hd} L${cx + hw} ${cy} L${cx} ${cy + hd} L${cx - hw} ${cy} Z`;
  const leftPath = `M${cx - hw} ${cy} L${cx} ${cy + hd} L${cx} ${cy + hd + h} L${cx - hw} ${cy + h} Z`;
  const rightPath = `M${cx} ${cy + hd} L${cx + hw} ${cy} L${cx + hw} ${cy + h} L${cx} ${cy + hd + h} Z`;

  return (
    <g>
      <path d={leftPath} fill={left} />
      <path d={rightPath} fill={right} />
      <path d={topPath} fill={top} />
      {children}
    </g>
  );
}

function GlassWindows({
  cx,
  cy,
  hw,
  h,
  rows = 5,
}: {
  cx: number;
  cy: number;
  hw: number;
  h: number;
  rows?: number;
}) {
  const lines = [];
  for (let i = 0; i < rows; i++) {
    const y = cy + 8 + i * (h / rows);
    lines.push(
      <line
        key={`h-${i}`}
        x1={cx - hw + 3}
        y1={y}
        x2={cx + hw - 3}
        y2={y}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="0.6"
      />
    );
  }
  for (let i = -2; i <= 2; i++) {
    lines.push(
      <line
        key={`v-${i}`}
        x1={cx + i * 5}
        y1={cy + 6}
        x2={cx + i * 5 + 3}
        y2={cy + h - 2}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="0.5"
      />
    );
  }
  return (
    <g>
      {lines}
      <path
        d={`M${cx - hw + 4} ${cy + 8} L${cx + 2} ${cy + h * 0.4} L${cx + hw - 4} ${cy + 14} Z`}
        fill="rgba(255,255,255,0.14)"
      />
    </g>
  );
}

function GlassTower({ cx, h, hw = 16, hd = 10 }: { cx: number; h: number; hw?: number; hd?: number }) {
  const cy = 96 - h - 8;
  return (
    <IsoPrism cx={cx} cy={cy} hw={hw} hd={hd} h={h} top={C.glassR} left={C.glassD} right={C.glassM}>
      <GlassWindows cx={cx} cy={cy} hw={hw} h={h} rows={Math.floor(h / 10)} />
    </IsoPrism>
  );
}

function PyramidTower({ cx, h = 58 }: { cx: number; h?: number }) {
  const base = 28;
  const cy = 96 - h;
  return (
    <g>
      <path
        d={`M${cx} ${cy} L${cx + base} ${cy + h * 0.35} L${cx} ${cy + h} L${cx - base} ${cy + h * 0.35} Z`}
        fill={C.concreteM}
      />
      <path
        d={`M${cx} ${cy} L${cx + base * 0.6} ${cy + h * 0.28} L${cx} ${cy + h * 0.85} L${cx - base * 0.6} ${cy + h * 0.28} Z`}
        fill={C.concreteL}
      />
      {[0.2, 0.35, 0.5, 0.65].map((t, i) => (
        <line
          key={i}
          x1={cx - base * 0.5 * (1 - t)}
          y1={cy + h * t}
          x2={cx + base * 0.5 * (1 - t)}
          y2={cy + h * t}
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="0.5"
        />
      ))}
    </g>
  );
}

function TwistedTower({ cx }: { cx: number }) {
  const h = 62;
  const cy = 34;
  return (
    <g>
      <path
        d={`M${cx - 14} ${cy + h} L${cx - 10} ${cy + 10} L${cx + 6} ${cy + 4} L${cx + 14} ${cy + h} Z`}
        fill={C.glassD}
      />
      <path
        d={`M${cx + 14} ${cy + h} L${cx + 8} ${cy + 12} L${cx - 6} ${cy + 6} L${cx - 14} ${cy + h} Z`}
        fill={C.glassM}
      />
      <path
        d={`M${cx - 10} ${cy + 10} L${cx + 6} ${cy + 4} L${cx + 8} ${cy + 12} L${cx - 6} ${cy + 6} Z`}
        fill={C.glassR}
      />
      <GlassWindows cx={cx} cy={cy + 6} hw={10} h={h - 8} rows={4} />
      <rect x={cx - 4} y={cy} width="8" height="4" rx="1" fill={C.roof} />
    </g>
  );
}

function ConcreteBlock({ cx, h, hw = 18 }: { cx: number; h: number; hw?: number }) {
  const cy = 96 - h - 6;
  return (
    <IsoPrism cx={cx} cy={cy} hw={hw} hd={9} h={h} top={C.concreteL} left={C.concreteD} right={C.concreteM}>
      <GlassWindows cx={cx} cy={cy} hw={hw} h={h} rows={Math.max(2, Math.floor(h / 12))} />
      <rect x={cx - hw * 0.4} y={cy - 2} width={hw * 0.8} height="3" fill={C.roof} />
    </IsoPrism>
  );
}

function StarterOffice() {
  return (
    <svg viewBox="0 0 80 100" className="iso-bld-svg" aria-hidden="true">
      <GroundShadow cx={40} cy={GROUND.y100} w={28} />
      <ConcreteBlock cx={40} h={22} hw={14} />
      <rect x="34" y="78" width="12" height="10" fill={C.stoneD} rx="1" />
    </svg>
  );
}

function BeigeOffice() {
  return (
    <svg viewBox="0 0 80 100" className="iso-bld-svg" aria-hidden="true">
      <GroundShadow cx={40} cy={GROUND.y100} w={32} />
      <ConcreteBlock cx={40} h={32} hw={16} />
    </svg>
  );
}

function GlassHq({ tall = false }: { tall?: boolean }) {
  const h = tall ? 52 : 38;
  return (
    <svg viewBox="0 0 80 100" className="iso-bld-svg" aria-hidden="true">
      <GroundShadow cx={40} cy={GROUND.y100} w={34} />
      <GlassTower cx={40} h={h} hw={tall ? 18 : 15} />
      <IsoPrism cx={40} cy={96 - h - 10} hw={20} hd={8} h={6} top={C.concreteL} left={C.concreteD} right={C.concreteM} />
    </svg>
  );
}

function LabTwisted() {
  return (
    <svg viewBox="0 0 80 100" className="iso-bld-svg" aria-hidden="true">
      <GroundShadow cx={40} cy={GROUND.y100} w={30} />
      <TwistedTower cx={40} />
    </svg>
  );
}

function CampusBlock() {
  return (
    <svg viewBox="0 0 96 100" className="iso-bld-svg" aria-hidden="true">
      <GroundShadow cx={48} cy={GROUND.y100} w={40} />
      <ConcreteBlock cx={30} h={26} hw={12} />
      <ConcreteBlock cx={58} h={30} hw={14} />
      <path d="M38 62 L48 58 L58 62 L48 66 Z" fill={C.green} opacity="0.85" />
    </svg>
  );
}

function ObservatoryPyramid() {
  return (
    <svg viewBox="0 0 80 100" className="iso-bld-svg" aria-hidden="true">
      <GroundShadow cx={40} cy={GROUND.y100} w={32} />
      <ConcreteBlock cx={40} h={18} hw={14} />
      <PyramidTower cx={40} h={48} />
    </svg>
  );
}

function MonumentPillar() {
  return (
    <svg viewBox="0 0 64 100" className="iso-bld-svg" aria-hidden="true">
      <GroundShadow cx={32} cy={GROUND.y100} w={22} />
      <IsoPrism cx={32} cy={72} hw={14} hd={8} h={10} top={C.stoneL} left={C.stoneD} right={C.concreteD} />
      <rect x="29" y="28" width="6" height="46" fill={C.concreteM} />
      <rect x="27" y="24" width="10" height="5" rx="1" fill={C.concreteL} />
    </svg>
  );
}

function CommTowerArt() {
  return (
    <svg viewBox="0 0 72 110" className="iso-bld-svg" aria-hidden="true">
      <GroundShadow cx={36} cy={GROUND.y110} w={28} />
      <GlassTower cx={36} h={56} hw={14} />
      <rect x="34" y="8" width="4" height="12" fill="#94a3b8" />
      <circle cx="36" cy="6" r="3" fill="#ef4444" opacity="0.9" />
    </svg>
  );
}

function PlazaArt() {
  return (
    <svg viewBox="0 0 80 72" className="iso-bld-svg" aria-hidden="true">
      <GroundShadow cx={40} cy={GROUND.y72} w={30} />
      <IsoPrism cx={40} cy={48} hw={22} hd={12} h={4} top={C.stoneL} left={C.stoneD} right={C.concreteD} />
      <ellipse cx="40" cy="44" rx="10" ry="5" fill="rgba(56,189,248,0.5)" />
      <rect x="38" y="34" width="4" height="10" fill={C.concreteL} />
    </svg>
  );
}

function TriumphArchArt() {
  return (
    <svg viewBox="0 0 80 88" className="iso-bld-svg" aria-hidden="true">
      <GroundShadow cx={40} cy={GROUND.y88} w={34} />
      <IsoPrism cx={22} cy={58} hw={8} hd={6} h={18} top={C.stoneL} left={C.stoneD} right={C.concreteD} />
      <IsoPrism cx={58} cy={58} hw={8} hd={6} h={18} top={C.stoneL} left={C.stoneD} right={C.concreteD} />
      <path d="M14 58 L40 42 L66 58 L40 50 Z" fill={C.concreteL} />
      <path d="M26 58 Q40 72 54 58" fill="none" stroke={C.shadowSoft} strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

function SkylineArt() {
  return (
    <svg viewBox="0 0 110 110" className="iso-bld-svg" aria-hidden="true">
      <GroundShadow cx={55} cy={GROUND.y110} w={48} />
      <PyramidTower cx={28} h={44} />
      <GlassTower cx={52} h={58} hw={12} />
      <TwistedTower cx={78} />
      <ConcreteBlock cx={92} h={28} hw={10} />
    </svg>
  );
}

export default function IsoBuildingArt({ variant, buildingId, height }: IsoBuildingArtProps) {
  switch (buildingId) {
    case 'foundation':
      return <StarterOffice />;
    case 'coach_desk':
    case 'coach_hq':
      return <BeigeOffice />;
    case 'premium_hq':
      return <GlassHq tall />;
    case 'innovation_lab':
      return <LabTwisted />;
    case 'roadmap_campus':
      return <CampusBlock />;
    case 'weekly_observatory':
      return <ObservatoryPyramid />;
    case 'discipline_monument':
      return <MonumentPillar />;
    case 'roadmap_tower':
      return <CommTowerArt />;
    case 'streak_plaza':
      return <PlazaArt />;
    case 'roadmap_arch':
      return <TriumphArchArt />;
    case 'business_district':
      return <SkylineArt />;
    default:
      if (variant === 'tower') return <CommTowerArt />;
      if (variant === 'skyline') return <SkylineArt />;
      if (variant === 'lab') return <LabTwisted />;
      return height >= 2 ? <GlassHq /> : <BeigeOffice />;
  }
}
