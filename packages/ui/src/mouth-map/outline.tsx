import type * as React from 'react';
import { SURFACE_LABELS, SURFACE_SHORT_LABELS, type SoreSurface } from '@canker/core';

import {
  MAPPED_SURFACES,
  SURFACE_GEOMETRY,
  SURFACE_PATHS,
  type MappedSurface
} from './geometry';

/**
 * @deprecated The mouth-map styles now ship in `@canker/ui/styles.css` (scoped
 * under `.mm-root`, which every mouth-map SVG root carries) and are no longer
 * injected into each rendered SVG. This constant is kept only so external
 * consumers that inlined it keep compiling; it is not used by any component.
 * If you edit these rules, edit `src/styles.css` — that copy is the live one.
 */
export const MOUTH_MAP_STYLES = `
.mm-root { display: block; font-family: var(--font-sans, system-ui, sans-serif); }
:where(.mm-root) .mm-surface { fill: var(--muted); stroke: var(--border); stroke-width: calc(1.5px * var(--mm-k, 1)); stroke-linejoin: round; transition: fill 150ms ease, stroke 150ms ease; outline: none; }
:where(.mm-root) .mm-surface.mm-panel { fill: var(--card); }
.mm-root[data-interactive="true"] .mm-surface { cursor: pointer; }
.mm-root[data-mode="place"] .mm-surface { cursor: crosshair; }
.mm-root[data-interactive="true"] .mm-surface:hover { fill: var(--accent-soft); }
:where(.mm-root) .mm-surface[data-selected="true"] { fill: var(--accent-soft); stroke: var(--accent); }
:where(.mm-root) .mm-surface:focus-visible { stroke: var(--ring); stroke-width: calc(2.5px * var(--mm-k, 1)); }
:where(.mm-root) .mm-label { fill: var(--muted-foreground); font-size: calc(9px * var(--mm-k, 1)); font-weight: 500; letter-spacing: 0.02em; text-anchor: middle; dominant-baseline: middle; pointer-events: none; user-select: none; }
:where(.mm-root) .mm-pin { cursor: pointer; outline: none; }
:where(.mm-root) .mm-pin-focus { stroke: none; fill: none; }
:where(.mm-root) .mm-pin:focus-visible .mm-pin-focus { stroke: var(--ring); }
:where(.mm-root) .mm-zoom { transition: transform 300ms cubic-bezier(0.2, 0, 0, 1); transform-origin: 0 0; transform-box: view-box; }
@media (prefers-reduced-motion: reduce) { :where(.mm-root) .mm-zoom { transition: none; } }
`;

/** Larger areas drawn as "panels" (card fill); everything else is a "band" (muted fill). */
const PANELS: ReadonlySet<MappedSurface> = new Set<MappedSurface>([
  'palate_hard',
  'cheek_left',
  'cheek_right',
  'tongue_dorsum'
]);

/** Surfaces big enough to carry a text label. */
const LABELLED: ReadonlySet<MappedSurface> = new Set<MappedSurface>([
  'lip_upper_inner',
  'gum_upper',
  'palate_hard',
  'palate_soft',
  'cheek_left',
  'cheek_right',
  'tongue_dorsum',
  'tongue_ventral',
  'floor_of_mouth',
  'gum_lower',
  'lip_lower_inner'
]);

export interface MouthOutlineProps {
  /** Whether surfaces are clickable / focusable. */
  interactive?: boolean;
  showLabels?: boolean;
  selectedSurface?: SoreSurface | null;
  onSurfaceClick?: (
    surface: MappedSurface,
    event: React.MouseEvent<SVGPathElement>
  ) => void;
  /** Enter / Space on a focused surface. */
  onSurfaceActivate?: (surface: MappedSurface) => void;
}

/** The 13 drawable surfaces plus optional labels. Shared by all mouth-map variants. */
export function MouthOutline({
  interactive = false,
  showLabels = false,
  selectedSurface,
  onSurfaceClick,
  onSurfaceActivate
}: MouthOutlineProps) {
  return (
    <>
      <g data-slot="mouth-surfaces">
        {MAPPED_SURFACES.map((surface) => {
          const selected = selectedSurface === surface;
          return (
            <path
              key={surface}
              d={SURFACE_PATHS[surface]}
              data-surface={surface}
              data-selected={selected ? 'true' : undefined}
              className={PANELS.has(surface) ? 'mm-surface mm-panel' : 'mm-surface'}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? SURFACE_LABELS[surface] : undefined}
              aria-pressed={interactive ? selected : undefined}
              onClick={
                interactive && onSurfaceClick
                  ? (e) => onSurfaceClick(surface, e)
                  : undefined
              }
              onKeyDown={
                interactive && onSurfaceActivate
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSurfaceActivate(surface);
                      }
                    }
                  : undefined
              }
            />
          );
        })}
      </g>
      {showLabels ? (
        <g data-slot="mouth-labels" aria-hidden>
          {MAPPED_SURFACES.filter((s) => LABELLED.has(s)).map((surface) => {
            const { label } = SURFACE_GEOMETRY[surface];
            return (
              <text key={surface} x={label.x} y={label.y} className="mm-label">
                {SURFACE_SHORT_LABELS[surface]}
              </text>
            );
          })}
        </g>
      ) : null}
    </>
  );
}
