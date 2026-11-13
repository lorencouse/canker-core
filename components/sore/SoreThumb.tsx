'use client';

import { useId } from 'react';

import { MapDefs, ViewArtwork } from '@/components/mouth-map/artwork';
import type { Sore } from '@/types';
import { cn } from '@/utils/cn';
import { fromPercent, viewBoxAttr } from '@/utils/mouth-map/geometry';
import { currentPain } from '@/utils/readings';
import { sevFill } from '@/utils/severity';

/**
 * The sore on the mouth map's own drawing, shrunk: the same artwork the Map
 * tab draws (never a simplified mouth), with the sore's dot in its pain
 * colour, enlarged so it still reads at this size. Shared by Today's open
 * sores and Insights' list of every sore.
 */
export default function SoreThumb({
  sore,
  size = 48,
  className
}: {
  sore: Sore;
  size?: number;
  className?: string;
}) {
  const p = `thumb${useId().replace(/:/g, '')}`;
  const placed = sore.x !== null && sore.y !== null;
  const dot = placed ? fromPercent({ x: sore.x!, y: sore.y! }) : null;
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-cell bg-muted',
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={viewBoxAttr}
        width={size}
        height={size}
        aria-hidden="true"
        focusable="false"
      >
        <MapDefs p={p} />
        <ViewArtwork view={sore.view} p={p} />
        {dot && (
          <circle
            cx={dot.x}
            cy={dot.y}
            r={40}
            fill={sevFill(currentPain(sore))}
            stroke="white"
            strokeWidth={14}
          />
        )}
      </svg>
    </span>
  );
}
