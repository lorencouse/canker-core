'use client';

import * as React from 'react';
import { painBucket, SURFACE_LABELS, type SoreSurface } from '@canker/core';

import { cn } from '../lib/cn';
import {
  isMappedSurface,
  SURFACE_GEOMETRY,
  surfaceToViewBox,
  VIEWBOX_SIZE,
  viewBoxToSurface,
  type MappedSurface
} from './geometry';
import { MOUTH_MAP_STYLES, MouthOutline } from './outline';

export interface MouthMapSore {
  id: string;
  surface: SoreSurface;
  /** Normalised 0..1 within the surface bbox. */
  x: number;
  /** Normalised 0..1 within the surface bbox. */
  y: number;
  pain: number | null;
  healed: boolean;
}

export interface MouthMapProps {
  sores: ReadonlyArray<MouthMapSore>;
  selectedSoreId?: string | null;
  selectedSurface?: SoreSurface | null;
  /** `view`: tapping selects sores/surfaces. `place`: tapping a surface fires `onPlace`. */
  mode: 'view' | 'place';
  onSelectSore?: (id: string) => void;
  onSelectSurface?: (surface: MappedSurface) => void;
  /** Place mode only. `x01`/`y01` are normalised within the surface bbox. */
  onPlace?: (surface: MappedSurface, x01: number, y01: number) => void;
  /** When set, smoothly zooms the drawing to that surface. */
  zoomTo?: SoreSurface | null;
  /** Show the small surface labels (default true). */
  showLabels?: boolean;
  className?: string;
  'aria-label'?: string;
}

const ZOOM_PADDING = 24;
const MAX_ZOOM = 4;

interface Zoom {
  s: number;
  tx: number;
  ty: number;
}

const IDENTITY: Zoom = { s: 1, tx: 0, ty: 0 };

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Zoom that fits a surface bbox (with padding) inside the viewBox, never showing blank margins. */
function zoomFor(surface: SoreSurface | null | undefined): Zoom {
  if (!isMappedSurface(surface)) return IDENTITY;
  const { bbox } = SURFACE_GEOMETRY[surface];
  const rw = bbox.w + ZOOM_PADDING * 2;
  const rh = bbox.h + ZOOM_PADDING * 2;
  const s = clamp(Math.min(VIEWBOX_SIZE / rw, VIEWBOX_SIZE / rh), 1, MAX_ZOOM);
  const cx = bbox.x + bbox.w / 2;
  const cy = bbox.y + bbox.h / 2;
  const minT = VIEWBOX_SIZE - s * VIEWBOX_SIZE;
  return {
    s,
    tx: clamp(VIEWBOX_SIZE / 2 - s * cx, minT, 0),
    ty: clamp(VIEWBOX_SIZE / 2 - s * cy, minT, 0)
  };
}

function pinFill(sore: MouthMapSore): string {
  if (sore.healed) return 'var(--heal)';
  if (sore.pain == null) return 'var(--muted-foreground)';
  return `var(--pain-${painBucket(sore.pain)})`;
}

function pinLabel(sore: MouthMapSore): string {
  const where = SURFACE_LABELS[sore.surface];
  if (sore.healed) return `${where}, healed`;
  if (sore.pain == null) return `${where}, pain not recorded`;
  return `${where}, pain ${Math.round(sore.pain)} of 10`;
}

/**
 * Interactive dental-chart-style mouth map. Sores render as pins that keep a
 * constant on-screen size while zoomed.
 */
export function MouthMap({
  sores,
  selectedSoreId = null,
  selectedSurface = null,
  mode,
  onSelectSore,
  onSelectSurface,
  onPlace,
  zoomTo = null,
  showLabels = true,
  className,
  'aria-label': ariaLabel
}: MouthMapProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const zoom = React.useMemo(() => zoomFor(zoomTo), [zoomTo]);
  const k = 1 / zoom.s;

  const selectedSore = selectedSoreId
    ? sores.find((s) => s.id === selectedSoreId)
    : undefined;
  const highlightSurface: SoreSurface | null =
    selectedSurface ?? selectedSore?.surface ?? null;

  // Only sores on a drawable surface; selected sore last so it paints on top.
  const visible = React.useMemo(() => {
    const list = sores.filter((s) => isMappedSurface(s.surface));
    if (!selectedSoreId) return list;
    return [
      ...list.filter((s) => s.id !== selectedSoreId),
      ...list.filter((s) => s.id === selectedSoreId)
    ];
  }, [sores, selectedSoreId]);

  const handleSurfaceClick = (
    surface: MappedSurface,
    e: React.MouseEvent<SVGPathElement>
  ) => {
    onSelectSurface?.(surface);
    if (mode !== 'place' || !onPlace) return;
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return;
    // Pointer -> root viewBox coordinates, then undo our own zoom transform.
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const vx = (p.x - zoom.tx) / zoom.s;
    const vy = (p.y - zoom.ty) / zoom.s;
    const { x, y } = viewBoxToSurface(surface, vx, vy);
    onPlace(surface, x, y);
  };

  const handleSurfaceActivate = (surface: MappedSurface) => {
    onSelectSurface?.(surface);
    if (mode === 'place') onPlace?.(surface, 0.5, 0.5);
  };

  const groupStyle = {
    transform:
      zoom.s === 1
        ? 'none'
        : `translate(${zoom.tx.toFixed(2)}px, ${zoom.ty.toFixed(2)}px) scale(${zoom.s.toFixed(3)})`,
    '--mm-k': k.toFixed(4)
  } as React.CSSProperties;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      className={cn('mm-root h-auto w-full touch-manipulation select-none', className)}
      data-slot="mouth-map"
      data-interactive="true"
      data-mode={mode}
      role="group"
      aria-label={
        ariaLabel ?? (mode === 'place' ? 'Mouth map: tap where the sore is' : 'Mouth map')
      }
    >
      <style>{MOUTH_MAP_STYLES}</style>
      <g className="mm-zoom" style={groupStyle}>
        <MouthOutline
          interactive
          showLabels={showLabels}
          selectedSurface={highlightSurface}
          onSurfaceClick={handleSurfaceClick}
          onSurfaceActivate={handleSurfaceActivate}
        />
        <g data-slot="mouth-pins">
          {visible.map((sore) => {
            const surface = sore.surface as MappedSurface;
            const pos = surfaceToViewBox(surface, sore.x, sore.y);
            const selected = sore.id === selectedSoreId;
            const activate = () => onSelectSore?.(sore.id);
            return (
              <g
                key={sore.id}
                className="mm-pin"
                data-sore-id={sore.id}
                data-selected={selected ? 'true' : undefined}
                role="button"
                tabIndex={0}
                aria-label={pinLabel(sore)}
                aria-pressed={selected}
                transform={`translate(${pos.x.toFixed(2)} ${pos.y.toFixed(2)})`}
                opacity={sore.healed ? 0.6 : 1}
                onClick={(e) => {
                  e.stopPropagation();
                  activate();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    activate();
                  }
                }}
              >
                {/* generous invisible hit target */}
                <circle r={16 * k} fill="transparent" stroke="none" />
                <circle className="mm-pin-focus" r={14 * k} strokeWidth={2 * k} />
                {selected ? (
                  <circle
                    r={12 * k}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={2 * k}
                  />
                ) : null}
                <circle
                  r={8 * k}
                  fill={pinFill(sore)}
                  stroke="var(--card)"
                  strokeWidth={2 * k}
                />
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
}
