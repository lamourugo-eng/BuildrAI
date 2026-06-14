import { gridToScreen, ISO_HERO } from '@/lib/city/iso-layout';
import { getTileVariant, type IsoTileVariant } from '@/lib/city/iso-tiles';

interface IsoTileProps {
  gx: number;
  gy: number;
  compact?: boolean;
  isGhost?: boolean;
  forceVariant?: IsoTileVariant;
}

export default function IsoTile({
  gx,
  gy,
  compact = false,
  isGhost = false,
  forceVariant,
}: IsoTileProps) {
  const pos = gridToScreen(gx, gy, compact);
  const variant = forceVariant ?? (isGhost ? 'ghost' : getTileVariant(gx, gy, ISO_HERO));

  return (
    <div
      className={[
        'iso-tile',
        `iso-tile--${variant}`,
        isGhost ? 'iso-tile--ghost' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: pos.x,
        top: pos.y,
        zIndex: pos.zIndex,
      }}
      aria-hidden="true"
    >
      <span className="iso-tile-surface" />
      {variant === 'road' && <span className="iso-tile-road-line" />}
      {variant === 'crosswalk' && <span className="iso-tile-crosswalk" />}
    </div>
  );
}
