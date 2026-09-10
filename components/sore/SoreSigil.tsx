import type { Sore } from '@/types';
import { cn } from '@/utils/cn';
import { FRONT, VIEW_BOX, viewBoxAttr } from '@/utils/mouth-map/geometry';
import { sigilShapes, type SigilShape } from '@/utils/mouth-map/sigil';
import { currentPain } from '@/utils/readings';

/**
 * A sore's sigil: the mouth map shrunk to a glyph, with one severity dot
 * where the sore actually is.
 *
 * A sore is a *place*, but away from the map it was only ever the string
 * "Upper lip". This carries the location into every list, card and header at
 * a size a label cannot compete with, and it makes the product's one
 * distinctive drawing part of its identity rather than of a single screen.
 *
 * The outlines come from utils/mouth-map/sigil.ts, which derives them from
 * the artwork's own constants. They are silhouettes and not the artwork
 * itself: at 26px, teeth, gradients and labels are mud.
 */

const tissue = 'hsl(var(--mm-tissue))';
const outline = 'hsl(var(--mm-ink-soft))';

/**
 * Stroke and dot are in drawing units so they scale with the glyph: a
 * hairline at 390 units wide is invisible at 26px.
 */
const STROKE = 10;
const DOT_R = 46;

function Shape({ shape }: { shape: SigilShape }) {
  const paint = { fill: tissue, stroke: outline, strokeWidth: STROKE };
  return shape.kind === 'ellipse' ? (
    <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...paint} />
  ) : (
    <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.r} {...paint} />
  );
}

export default function SoreSigil({
  sore,
  size = 26,
  className
}: {
  sore: Sore;
  size?: number;
  className?: string;
}) {
  const pain = currentPain(sore);
  // Sores predating the mouth map have no coordinates. They still get a
  // glyph — which view they were on is real information — just no dot.
  const placed = sore.x !== null && sore.y !== null;

  return (
    <svg
      viewBox={viewBoxAttr}
      width={size}
      height={size}
      // The zone and the day sit beside every sigil in prose; a screen reader
      // reading the drawing as well would only repeat them.
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
    >
      {sigilShapes(sore.view).map((shape, i) => (
        <Shape key={i} shape={shape} />
      ))}

      {/* The tongue, so the front view is not a bare oval. */}
      {sore.view === 'front' && (
        <rect
          x={FRONT.tongue.x}
          y={FRONT.tongue.top}
          width={FRONT.tongue.w}
          height={FRONT.tongue.bottom - FRONT.tongue.top}
          rx={FRONT.tongue.w / 2}
          fill="hsl(var(--mm-tongue-deep))"
        />
      )}

      {placed && (
        <circle
          cx={(sore.x! / 100) * VIEW_BOX.width}
          cy={(sore.y! / 100) * VIEW_BOX.height}
          r={DOT_R}
          fill={`hsl(var(--sev-${pain}))`}
          // A ring in the surrounding ground, so a pale dot on pale tissue
          // and a hot dot on dark tissue both hold their edge.
          stroke="hsl(var(--card))"
          strokeWidth={STROKE * 1.4}
        />
      )}
    </svg>
  );
}
