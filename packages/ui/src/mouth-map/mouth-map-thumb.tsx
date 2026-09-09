import { painBucket, SURFACE_LABELS, type SoreSurface } from '@canker/core';

import { cn } from '../lib/cn';
import {
  isMappedSurface,
  surfaceToViewBox,
  VIEWBOX_SIZE,
  type MappedSurface
} from './geometry';
import { MouthOutline } from './outline';

export interface MouthMapThumbSore {
  surface: SoreSurface;
  x: number;
  y: number;
  pain: number | null;
  healed: boolean;
}

export interface MouthMapThumbProps {
  /** Rendered width/height in px (default 64). */
  size?: number;
  /** The one sore to highlight; its surface is tinted and a pin is drawn. */
  sore?: MouthMapThumbSore | null;
  className?: string;
  /** Provide to expose the thumb to assistive tech; otherwise it is decorative. */
  'aria-label'?: string;
}

/** Tiny non-interactive mouth outline with one highlighted sore, for cards and lists. */
export function MouthMapThumb({
  size = 64,
  sore = null,
  className,
  'aria-label': ariaLabel
}: MouthMapThumbProps) {
  // Narrow the surface separately: the type guard does not flow through `sore.surface`.
  const surface: MappedSurface | null =
    sore && isMappedSurface(sore.surface) ? sore.surface : null;
  const mapped = surface && sore ? sore : null;
  const pos = surface && mapped ? surfaceToViewBox(surface, mapped.x, mapped.y) : null;
  const fill = mapped
    ? mapped.healed
      ? 'var(--heal)'
      : mapped.pain == null
        ? 'var(--muted-foreground)'
        : `var(--pain-${painBucket(mapped.pain)})`
    : null;
  const label =
    ariaLabel ??
    (surface && mapped
      ? `${SURFACE_LABELS[surface]}${mapped.healed ? ', healed' : ''}`
      : undefined);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      className={cn('mm-root shrink-0', className)}
      data-slot="mouth-map-thumb"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <MouthOutline selectedSurface={surface} />
      {pos && fill ? (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={16}
          fill={fill}
          stroke="var(--card)"
          strokeWidth={4}
          opacity={mapped?.healed ? 0.7 : 1}
        />
      ) : null}
    </svg>
  );
}
