import type { BuildingStatus } from '@/lib/city/engine';
import IsoBuildingArt from '@/components/city/IsoBuildingArt';
import { getBuildingGroundOffset, getIsoSlot, gridToScreen } from '@/lib/city/iso-layout';

interface IsoBuildingProps {
  building: BuildingStatus;
  compact?: boolean;
  isNew?: boolean;
  appearIndex?: number;
  isSelected?: boolean;
  onSelect?: (buildingId: string) => void;
}

export default function IsoBuilding({
  building,
  compact = false,
  isNew = false,
  appearIndex = 0,
  isSelected = false,
  onSelect,
}: IsoBuildingProps) {
  if (!building.unlocked) return null;

  const slot = getIsoSlot(building.id);
  const pos = gridToScreen(slot.gx, slot.gy, compact);
  const scale = building.scale ?? 1;
  const groundOffset = getBuildingGroundOffset(compact);

  const interactive = !compact && Boolean(onSelect);

  return (
    <div
      className={[
        'iso-bld',
        'iso-bld--art',
        `iso-bld--${building.id}`,
        `iso-bld--${slot.variant}`,
        isNew ? 'iso-bld--constructing' : 'iso-bld--built',
        isSelected ? 'iso-bld--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: pos.x,
        top: pos.y,
        zIndex: isSelected ? pos.zIndex + slot.height + 120 : pos.zIndex + slot.height + 20,
        ['--iso-scale' as string]: scale,
        ['--iso-ground-offset' as string]: `${groundOffset}px`,
        ['--appear-delay' as string]: isNew ? '0s' : `${appearIndex * 0.07}s`,
      }}
    >
      <div
        className="iso-bld-anchor"
        title={building.name}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? building.name : undefined}
        aria-pressed={interactive ? isSelected : undefined}
        onClick={
          interactive
            ? (event) => {
                event.stopPropagation();
                onSelect?.(building.id);
              }
            : undefined
        }
        onKeyDown={
          interactive
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  onSelect?.(building.id);
                }
              }
            : undefined
        }
      >
        {isNew && (
          <>
            <span className="iso-construct-ring" aria-hidden="true" />
            <span className="iso-construct-dust iso-construct-dust--1" aria-hidden="true" />
            <span className="iso-construct-dust iso-construct-dust--2" aria-hidden="true" />
            <span className="iso-construct-dust iso-construct-dust--3" aria-hidden="true" />
          </>
        )}
        <div className="iso-bld-art-wrap">
          <IsoBuildingArt
            variant={slot.variant}
            buildingId={building.id}
            height={slot.height}
          />
          <span className="iso-bld-hit" aria-hidden="true" />
        </div>
        {!compact && <span className="iso-bld-label">{building.name}</span>}
      </div>
    </div>
  );
}
