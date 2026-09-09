import { painBucket, type SoreSurface } from '@canker/core';

import { cn } from '../lib/cn';
import { isMappedSurface, surfaceToViewBox, VIEWBOX_SIZE } from './geometry';
import { MOUTH_MAP_STYLES, MouthOutline } from './outline';

export interface MouthHeatmapSore {
  id: string;
  surface: SoreSurface;
  x: number;
  y: number;
  pain: number | null;
  healed: boolean;
}

export interface MouthHeatmapProps {
  sores: ReadonlyArray<MouthHeatmapSore>;
  /** Show the small surface labels (default true). */
  showLabels?: boolean;
  /** Blob radius in viewBox units (default 22). */
  radius?: number;
  className?: string;
  'aria-label'?: string;
}

/**
 * "Where have my sores been": the outline with each sore drawn as a soft
 * translucent blob coloured by its pain bucket. Overlaps build up naturally.
 */
export function MouthHeatmap({
  sores,
  showLabels = true,
  radius = 22,
  className,
  'aria-label': ariaLabel
}: MouthHeatmapProps) {
  const visible = sores.filter((s) => isMappedSurface(s.surface));
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      className={cn('mm-root h-auto w-full', className)}
      data-slot="mouth-heatmap"
      role="img"
      aria-label={
        ariaLabel ??
        `Mouth heatmap, ${visible.length} ${visible.length === 1 ? 'sore' : 'sores'}`
      }
    >
      <style>{MOUTH_MAP_STYLES}</style>
      <MouthOutline showLabels={showLabels} />
      <g data-slot="mouth-heat" style={{ pointerEvents: 'none' }}>
        {visible.map((sore) => {
          if (!isMappedSurface(sore.surface)) return null;
          const pos = surfaceToViewBox(sore.surface, sore.x, sore.y);
          const fill = sore.healed
            ? 'var(--heal)'
            : sore.pain == null
              ? 'var(--muted-foreground)'
              : `var(--pain-${painBucket(sore.pain)})`;
          return (
            <circle
              key={sore.id}
              cx={pos.x.toFixed(2)}
              cy={pos.y.toFixed(2)}
              r={radius}
              fill={fill}
              fillOpacity={0.18}
              data-sore-id={sore.id}
            />
          );
        })}
      </g>
    </svg>
  );
}
