import type { BuildingStatus } from '@/lib/city/engine';
import IsoBuildingArt from '@/components/city/IsoBuildingArt';
import { getBuildingGroundOffset, getIsoSlot, gridToScreen } from '@/lib/city/iso-layout';

interface IsoBuildingProps {
  building: BuildingStatus;
  compact?: boolean;
  isNew?: boolean;
  appearIndex?: number;
}

export default function IsoBuilding({
  building,
  compact = false,
  isNew = false,
  appearIndex = 0,
}: IsoBuildingProps) {
  if (!building.unlocked) return null;

  const slot = getIsoSlot(building.id);
  const pos = gridToScreen(slot.gx, slot.gy, compact);
  const scale = building.scale ?? 1;
  const groundOffset = getBuildingGroundOffset(compact);

  return (
    <div
      className={[
        'iso-bld',
        'iso-bld--art',
        `iso-bld--${building.id}`,
        `iso-bld--${slot.variant}`,
        isNew ? 'iso-bld--constructing' : 'iso-bld--built',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: pos.x,
        top: pos.y,
        zIndex: pos.zIndex + slot.height + 20,
        ['--iso-scale' as string]: scale,
        ['--iso-ground-offset' as string]: `${groundOffset}px`,
        ['--appear-delay' as string]: isNew ? '0s' : `${appearIndex * 0.07}s`,
      }}
      title={building.name}
    >
      <div className="iso-bld-anchor">
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
        </div>
      </div>
      {!compact && <span className="iso-bld-label">{building.name}</span>}
    </div>
  );
}
