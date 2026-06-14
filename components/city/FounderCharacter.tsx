import type { CSSProperties } from 'react';
import type { FounderAvatar, FounderLook } from '@/lib/city/avatar-data';
import {
  getCustomizerPreviewAppearance,
  getEffectiveAvatarAppearance,
  type VisualTier,
} from '@/lib/city/avatar-visual';

interface FounderCharacterProps {
  avatar: FounderAvatar;
  levelId?: number;
  visualTier?: VisualTier;
  celebrating?: boolean;
  compact?: boolean;
  preview?: boolean;
  customizerPreview?: boolean;
  showBadge?: boolean;
  showEvolutionHint?: boolean;
}

function Face({
  skin,
  hasGlasses,
  look,
}: {
  skin: string;
  hasGlasses: boolean;
  look: FounderLook;
}) {
  const jaw = 'M37 52 Q37 67 50 69 Q63 67 63 52 Q63 41 50 39 Q37 41 37 52';

  const browColor = look === 'bold' ? '#3d2314' : '#5c4033';

  return (
    <g className="founder-face">
      <ellipse cx="50" cy="52" rx="14" ry="16" fill={skin} />
      <path d={jaw} fill={skin} />
      <path d="M46 66 Q50 72 54 66 L52 78 Q50 80 48 78 Z" fill={skin} opacity="0.95" />
      <ellipse cx="36" cy="52" rx="2.5" ry="4" fill={skin} />
      <ellipse cx="64" cy="52" rx="2.5" ry="4" fill={skin} />
      <ellipse cx="44" cy="50" rx="3.5" ry="4" fill="#fff" />
      <ellipse cx="56" cy="50" rx="3.5" ry="4" fill="#fff" />
      <circle cx="44.5" cy="50.5" r="2" fill="#1e293b" />
      <circle cx="56.5" cy="50.5" r="2" fill="#1e293b" />
      <circle cx="45" cy="49.5" r="0.7" fill="#fff" />
      <circle cx="57" cy="49.5" r="0.7" fill="#fff" />
      <path d="M40 45 Q44 43 48 45" stroke={browColor} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M52 45 Q56 43 60 45" stroke={browColor} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M50 52 L49 56 Q50 57 51 56 Z" fill="rgba(0,0,0,0.08)" />
      <path d="M46 58 Q50 61 54 58" stroke="#c4846c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {look === 'bold' && (
        <>
          <ellipse cx="41" cy="55" rx="3.5" ry="2.2" fill="rgba(236,72,153,0.18)" />
          <ellipse cx="59" cy="55" rx="3.5" ry="2.2" fill="rgba(236,72,153,0.18)" />
        </>
      )}
      {hasGlasses && (
        <g className="founder-glasses">
          <circle cx="44" cy="50" r="6" fill="rgba(255,255,255,0.08)" stroke="#1e293b" strokeWidth="1.4" />
          <circle cx="56" cy="50" r="6" fill="rgba(255,255,255,0.08)" stroke="#1e293b" strokeWidth="1.4" />
          <line x1="49.5" y1="50" x2="50.5" y2="50" stroke="#1e293b" strokeWidth="1.2" />
          <path d="M38 49 Q36 47 34 46" stroke="#1e293b" strokeWidth="1.2" fill="none" />
          <path d="M62 49 Q64 47 66 46" stroke="#1e293b" strokeWidth="1.2" fill="none" />
          <path d="M38 49 L32 48" stroke="#1e293b" strokeWidth="1" />
          <path d="M62 49 L68 48" stroke="#1e293b" strokeWidth="1" />
        </g>
      )}
    </g>
  );
}

function Legs({
  primary,
  secondary,
  outfit,
}: {
  primary: string;
  secondary: string;
  outfit: FounderAvatar['outfit'];
}) {
  const hipW = 20;
  const pantColor = outfit === 'smart' ? secondary : primary;
  const shoeColor = outfit === 'smart' ? '#0f172a' : '#1e293b';

  return (
    <g className="founder-legs">
      <path
        d={`M${50 - hipW / 2} 108 Q50 112 ${50 + hipW / 2} 108 L${50 + 8} 132 Q50 134 ${50 - 8} 132 Z`}
        fill={secondary}
      />
      <path d="M42 108 L40 132 Q42 134 44 132 L46 108 Z" fill={pantColor} />
      <path d="M58 108 L60 132 Q58 134 56 132 L54 108 Z" fill={pantColor} />
      {outfit === 'smart' && (
        <>
          <path d="M42 108 L42 118" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <path d="M58 108 L58 118" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        </>
      )}
      <ellipse cx="42" cy="133" rx="7" ry="3" fill={shoeColor} />
      <ellipse cx="58" cy="133" rx="7" ry="3" fill={shoeColor} />
      {outfit === 'smart' && (
        <>
          <path d="M38 132 L46 132" stroke="#334155" strokeWidth="1.2" />
          <path d="M54 132 L62 132" stroke="#334155" strokeWidth="1.2" />
        </>
      )}
    </g>
  );
}

function LookDetail({
  outfit,
  look,
  accent,
  sx,
  shoulderW,
}: {
  outfit: FounderAvatar['outfit'];
  look: FounderLook;
  accent: string;
  sx: number;
  shoulderW: number;
}) {
  if (look === 'startup' && (outfit === 'casual' || outfit === 'hoodie')) {
    return (
      <g>
        <rect x={46} y={86} width="8" height="8" rx="2" fill={accent} opacity="0.85" />
        <path d="M48 88 L50 92 L52 88" stroke="#fff" strokeWidth="0.8" fill="none" />
      </g>
    );
  }
  if (look === 'bold' && outfit === 'casual') {
    return (
      <path
        d={`M${sx + 6} 92 L${sx + shoulderW - 6} 92`}
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
      />
    );
  }
  if (look === 'minimal') {
    return (
      <path
        d={`M${sx + 10} 90 L${sx + shoulderW - 10} 90`}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
    );
  }
  return null;
}

function TorsoAndArms({
  outfit,
  primary,
  secondary,
  accent,
  accessory,
  look,
  laptopSize,
}: {
  outfit: FounderAvatar['outfit'];
  primary: string;
  secondary: string;
  accent: string;
  accessory: FounderAvatar['accessory'];
  look: FounderLook;
  laptopSize: 'small' | 'medium' | 'large';
}) {
  const shoulderW = 34;
  const sx = 50 - shoulderW / 2;
  const holdingItem = accessory === 'laptop' || accessory === 'tablet' || accessory === 'coffee';
  const torsoPath = `M${sx} 78 Q${sx - 4} 82 ${sx} 108 L${sx + shoulderW} 108 Q${sx + shoulderW + 4} 82 ${sx + shoulderW} 78 Q50 74 ${sx} 78`;

  if (outfit === 'hoodie') {
    return (
      <g className="founder-outfit founder-outfit--hoodie">
        <path d="M38 76 Q50 68 62 76 L60 82 Q50 78 40 82 Z" fill={secondary} opacity="0.9" />
        <path d={torsoPath} fill={primary} />
        <path d={`M${sx - 2} 78 Q50 88 ${sx + shoulderW + 2} 78`} stroke={secondary} strokeWidth="2.5" fill="none" />
        <path d="M48 84 L52 84 L50 96 Z" fill={secondary} />
        <line x1="49" y1="96" x2="49" y2="102" stroke={secondary} strokeWidth="1" />
        <line x1="51" y1="96" x2="51" y2="102" stroke={secondary} strokeWidth="1" />
        <path d="M44 100 Q50 108 56 100 Q50 104 44 100" fill={secondary} opacity="0.7" />
        <path d="M34 82 Q28 92 30 104 Q32 106 36 102 L38 86 Z" fill={primary} />
        <path d="M38 104 Q36 106 34 108" stroke={secondary} strokeWidth="2" fill="none" />
        {holdingItem ? (
          <path d="M66 82 Q72 90 70 100 L64 102 Q60 98 62 86 Z" fill={primary} />
        ) : (
          <path d="M66 82 Q72 92 70 108 Q68 110 64 106 L62 86 Z" fill={primary} />
        )}
        <path d="M66 104 Q68 106 70 108" stroke={secondary} strokeWidth="2" fill="none" />
        <LookDetail outfit={outfit} look={look} accent={accent} sx={sx} shoulderW={shoulderW} />
        <Hands accessory={accessory} laptopSize={laptopSize} accent={accent} holding={holdingItem} />
      </g>
    );
  }

  if (outfit === 'blazer') {
    return (
      <g className="founder-outfit founder-outfit--blazer">
        <path d="M47 78 L50 82 L53 78" fill="#f8fafc" />
        <path d={torsoPath} fill={primary} />
        <path d={`M${sx + 4} 78 L50 102 L${sx + shoulderW - 4} 78`} fill={secondary} opacity="0.85" />
        <path d={`M${sx + 2} 78 L50 102 L${sx + 8} 78`} fill={primary} opacity="0.95" />
        <path d={`M${sx + shoulderW - 8} 78 L50 102 L${sx + shoulderW - 2} 78`} fill={primary} opacity="0.95" />
        <circle cx="50" cy="92" r="1.2" fill={accent} />
        <circle cx="50" cy="99" r="1.2" fill={accent} />
        <rect x={sx + shoulderW - 10} y={84} width="6" height="5" rx="1" fill={secondary} opacity="0.5" />
        <path d="M48 78 L50 108 L52 78" fill="#f8fafc" opacity="0.75" />
        <path d="M34 82 Q28 94 30 106 Q34 108 38 102 L40 86 Z" fill={primary} />
        <path d="M62 86 L64 102 Q68 108 72 106 Q74 94 68 82 Z" fill={primary} />
        <Hands accessory={accessory} laptopSize={laptopSize} accent={accent} holding={holdingItem} />
      </g>
    );
  }

  if (outfit === 'smart') {
    return (
      <g className="founder-outfit founder-outfit--smart">
        <path d="M46 76 L50 80 L54 76 L52 78 L48 78 Z" fill="#f8fafc" />
        <path d={torsoPath} fill={primary} />
        <path d={`M${sx + 4} 78 L50 102 L${sx + shoulderW - 4} 78`} fill={secondary} opacity="0.9" />
        <path d="M49 82 L50 104 L51 82" fill={accent} />
        <path d="M47 82 L53 82 L52 87 L48 87 Z" fill={accent} />
        <path d="M48 78 L50 108 L52 78" fill="#f8fafc" opacity="0.8" />
        <rect x={sx + shoulderW - 11} y={85} width="5" height="5" fill={accent} opacity="0.6" />
        <path d="M34 82 Q28 94 30 106 Q34 108 38 102 L40 86 Z" fill={primary} />
        <path d="M62 86 L64 102 Q68 108 72 106 Q74 94 68 82 Z" fill={primary} />
        <Hands accessory={accessory} laptopSize={laptopSize} accent={accent} holding={holdingItem} />
      </g>
    );
  }

  return (
    <g className="founder-outfit founder-outfit--casual">
      <path d={torsoPath} fill={primary} />
      <path d={`M${sx + 4} 78 Q50 84 ${sx + shoulderW - 4} 78`} fill="none" stroke={secondary} strokeWidth="2" />
      <path d={`M${sx + 8} 88 L${sx + shoulderW - 8} 88`} stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
      <path d="M34 82 Q28 94 30 106 Q34 108 38 102 L40 86 Z" fill={primary} />
      <path d="M38 86 L36 102" stroke={secondary} strokeWidth="1.5" opacity="0.5" />
      <path d="M62 86 L64 102 Q68 108 72 106 Q74 94 68 82 Z" fill={primary} />
      <path d="M62 86 L64 102" stroke={secondary} strokeWidth="1.5" opacity="0.5" />
      <LookDetail outfit={outfit} look={look} accent={accent} sx={sx} shoulderW={shoulderW} />
      <Hands accessory={accessory} laptopSize={laptopSize} accent={accent} holding={holdingItem} />
    </g>
  );
}

function Hands({
  accessory,
  laptopSize,
  accent,
  holding,
}: {
  accessory: FounderAvatar['accessory'];
  laptopSize: 'small' | 'medium' | 'large';
  accent: string;
  holding: boolean;
}) {
  const skin = '#fcd9b6';
  const sizes = { small: [22, 15], medium: [28, 19], large: [34, 23] } as const;
  const [lw, lh] = sizes[laptopSize];

  return (
    <g className="founder-hands">
      <ellipse cx="32" cy="106" rx="4" ry="5" fill={skin} />
      {accessory === 'laptop' && holding && (
        <g className="founder-prop founder-prop--laptop" transform="translate(58, 88)">
          <rect width={lw} height={lh} rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <rect x="2" y="2" width={lw - 4} height={lh - 7} rx="1" fill="#334155" />
          <rect x="3" y="3" width={lw - 6} height={lh - 10} rx="1" fill={accent} opacity="0.5" />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={5 + i * 5} y={lh - 5} width="3" height="1.5" rx="0.3" fill="#64748b" />
          ))}
          <ellipse cx={lw / 2 + 4} cy={lh + 2} rx="5" ry="4" fill={skin} />
        </g>
      )}
      {accessory === 'tablet' && holding && (
        <g className="founder-prop founder-prop--tablet" transform="translate(60, 90)">
          <rect width="16" height="22" rx="2" fill="#1e293b" stroke={accent} strokeWidth="1.2" />
          <rect x="2" y="2" width="12" height="16" rx="1" fill={accent} opacity="0.35" />
          <circle cx="8" cy="20" r="1" fill="#64748b" />
          <ellipse cx="20" cy="16" rx="4" ry="5" fill={skin} />
        </g>
      )}
      {accessory === 'coffee' && holding && (
        <g className="founder-prop founder-prop--coffee" transform="translate(62, 94)">
          <path d="M0 4 Q0 0 5 0 L9 0 Q14 0 14 4 L14 14 Q14 18 7 18 Q0 18 0 14 Z" fill="#78350f" />
          <ellipse cx="7" cy="4" rx="7" ry="2" fill="#92400e" />
          <path d="M14 6 Q20 6 20 10 Q20 14 14 14" fill="none" stroke="#78350f" strokeWidth="2" />
          <path d="M3 0 Q5 -4 7 0" stroke="rgba(255,255,255,0.35)" strokeWidth="1" fill="none" />
          <ellipse cx="18" cy="14" rx="4" ry="5" fill={skin} />
        </g>
      )}
      {(!holding || accessory === 'none' || accessory === 'glasses') && (
        <ellipse cx="68" cy="106" rx="4" ry="5" fill={skin} />
      )}
    </g>
  );
}

export default function FounderCharacter({
  avatar,
  levelId = 1,
  visualTier = 'beginner',
  celebrating = false,
  compact = false,
  preview = false,
  customizerPreview = false,
  showBadge = true,
  showEvolutionHint = false,
}: FounderCharacterProps) {
  const appearance = customizerPreview
    ? getCustomizerPreviewAppearance(avatar, levelId)
    : getEffectiveAvatarAppearance(avatar, visualTier, levelId);
  const { colors } = appearance;
  const scale = compact ? 0.72 : preview ? 0.95 : 0.82 + levelId * 0.035;

  return (
    <div
      className={[
        'founder-character',
        'founder-character--human',
        `founder-character--${appearance.profile}`,
        `founder-character--${appearance.outfitTier}`,
        `founder-character--neutral`,
        `founder-character--look-${appearance.look}`,
        `founder-character--outfit-${appearance.outfit}`,
        `founder-character--acc-${appearance.accessory}`,
        celebrating ? 'founder-character--celebrate' : '',
        compact ? 'founder-character--compact' : '',
        preview ? 'founder-character--preview' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          '--char-primary': colors.primary,
          '--char-secondary': colors.secondary,
          '--char-accent': colors.accent,
          '--char-scale': scale,
        } as CSSProperties
      }
    >
      {appearance.visualTier === 'advanced' && (
        <span className="founder-character-aura" aria-hidden="true" />
      )}
      <div className="founder-character-shadow" aria-hidden="true" />

      <svg
        className="founder-character-svg"
        viewBox="0 0 100 140"
        aria-label={`${appearance.name}, ${appearance.evolutionLabel}`}
        role="img"
      >
        <ellipse cx="50" cy="136" rx="18" ry="4" fill="rgba(0,0,0,0.35)" />

        <Legs
          primary={colors.primary}
          secondary={colors.secondary}
          outfit={appearance.outfit}
        />

        <TorsoAndArms
          outfit={appearance.outfit}
          primary={colors.primary}
          secondary={colors.secondary}
          accent={colors.accent}
          accessory={appearance.accessory}
          look={appearance.look}
          laptopSize={appearance.laptopSize}
        />

        <Face
          skin={colors.skin}
          hasGlasses={appearance.accessory === 'glasses'}
          look={appearance.look}
        />

        {appearance.showFounderBadge && (
          <g transform="translate(66, 30)">
            <circle r="7" fill={colors.accent} />
            <path d="M-3 1 L0 -3 L3 1 L0 4 Z" fill="#0f172a" opacity="0.8" />
          </g>
        )}
      </svg>

      {showBadge && !compact && (
        <div className="founder-character-badge">
          <span className="founder-character-level">Niv. {appearance.levelId}</span>
          <strong>{appearance.name}</strong>
          {showEvolutionHint && (
            <span className="founder-character-evolution">{appearance.evolutionLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
