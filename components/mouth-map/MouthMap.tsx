'use client';

import type React from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useSoreContext } from '@/context/SoreContext';
import type { Sore, User } from '@/types';
import {
  MOUTH_VIEWS,
  VIEW_BOX,
  VIEW_LABELS,
  ZONE_ANCHORS,
  fromPercent,
  radiusFor,
  toPercent,
  viewBoxAttr,
  zoneAt,
  type MouthView,
  type Point
} from '@/utils/mouth-map/geometry';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/utils/cn';
import { tap } from '@/utils/native';
import { currentPain, currentSize, newReading } from '@/utils/readings';

import { MapDefs, ViewArtwork } from './artwork';
import MapControls from './MapControls';
import SoreMarker from './SoreMarker';

/**
 * The mouth map: three flat views (Front, Cheeks, Lips) behind a segmented
 * control, drawn as SVG so it scales, prints, and follows the theme.
 *
 * Interaction model
 *   view mode   tap a sore to select it; drag to pan; wheel / pinch to zoom
 *   add mode    tap tissue to place a sore (taps off the tissue do nothing)
 *   edit mode   drag a sore to move it; its zone follows
 *
 * Coordinates are kept in drawing units (the SVG viewBox) while interacting
 * and converted to percentages only when written to a sore.
 */

const MIN_SCALE = 1;
const MAX_SCALE = 5;
/** Pointer travel before a press counts as a drag rather than a tap. */
const DRAG_THRESHOLD = 4;

type Camera = { k: number; tx: number; ty: number };
const HOME: Camera = { k: 1, tx: 0, ty: 0 };

export default function MouthMap({ user }: { user: User }) {
  const {
    sores,
    setSores,
    visibleSores,
    showHealed,
    setShowHealed,
    selectedSore,
    setSelectedSore,
    mode
  } = useSoreContext();
  const healedCount = sores.filter((s) => s.healed_at).length;
  const [view, setView] = useState<MouthView>('front');
  const [camera, setCamera] = useState<Camera>(HOME);
  const svgRef = useRef<SVGSVGElement>(null);
  const idPrefix = useId().replace(/:/g, '');

  // Selecting a sore elsewhere (the details card's arrows) brings its view up.
  useEffect(() => {
    if (selectedSore?.view && selectedSore.view !== view)
      setView(selectedSore.view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSore?.id]);

  /* ---- coordinate conversion ------------------------------------------- */

  /** Client pixels -> drawing units, accounting for the camera. */
  const toDrawing = useCallback(
    (clientX: number, clientY: number): Point => {
      const svg = svgRef.current!;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
      return {
        x: (pt.x - camera.tx) / camera.k,
        y: (pt.y - camera.ty) / camera.k
      };
    },
    [camera]
  );

  /** Drawing units per client pixel, for converting pan deltas. */
  const unitsPerPixel = () => {
    const svg = svgRef.current;
    if (!svg) return 1;
    return VIEW_BOX.width / svg.getBoundingClientRect().width;
  };

  /* ---- zoom ------------------------------------------------------------- */

  const zoomAbout = useCallback((factor: number, anchor: Point) => {
    setCamera((c) => {
      const k = Math.min(MAX_SCALE, Math.max(MIN_SCALE, c.k * factor));
      if (k === c.k) return c;
      // Keep the drawing point under `anchor` fixed on screen.
      const ratio = k / c.k;
      return {
        k,
        tx: anchor.x - (anchor.x - c.tx) * ratio,
        ty: anchor.y - (anchor.y - c.ty) * ratio
      };
    });
  }, []);

  const zoomCentre = (factor: number) =>
    zoomAbout(factor, { x: VIEW_BOX.width / 2, y: VIEW_BOX.height / 2 });
  const resetCamera = () => setCamera(HOME);

  // Wheel zoom needs a non-passive listener to stop the page scrolling.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(
        ctm.inverse()
      );
      zoomAbout(e.deltaY > 0 ? 0.9 : 1.1, pt);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoomAbout]);

  /* ---- pointer handling: pan, pinch, tap -------------------------------- */

  type Gesture = {
    pointers: Map<number, { x: number; y: number }>;
    startCamera: Camera;
    moved: boolean;
    pinchDist: number | null;
    // The sore being dragged, if the press started on one in an editing mode.
    dragging: Sore | null;
  };
  const gesture = useRef<Gesture | null>(null);

  const onPointerDown = (
    e: React.PointerEvent<SVGSVGElement>,
    sore: Sore | null = null
  ) => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.setPointerCapture(e.pointerId);
    const g = gesture.current ?? {
      pointers: new Map(),
      startCamera: camera,
      moved: false,
      pinchDist: null,
      dragging: null
    };
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (g.pointers.size === 1 && sore && mode !== 'view') g.dragging = sore;
    if (g.pointers.size === 2) {
      const [a, b] = Array.from(g.pointers.values());
      g.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      g.dragging = null;
    }
    gesture.current = g;
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || !g.pointers.has(e.pointerId)) return;
    const prev = g.pointers.get(e.pointerId)!;
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (g.pointers.size === 2 && g.pinchDist) {
      const [a, b] = Array.from(g.pointers.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const svg = svgRef.current!;
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const mid = new DOMPoint(
          (a.x + b.x) / 2,
          (a.y + b.y) / 2
        ).matrixTransform(ctm.inverse());
        zoomAbout(dist / g.pinchDist, mid);
      }
      g.pinchDist = dist;
      g.moved = true;
      return;
    }

    const dx = e.clientX - prev.x,
      dy = e.clientY - prev.y;
    if (!g.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    g.moved = true;

    if (g.dragging) {
      const p = toDrawing(e.clientX, e.clientY);
      const pct = toPercent(p);
      const zone = zoneAt(view, p);
      if (!zone) return; // Do not let a sore leave the tissue.
      const moved = { ...g.dragging, x: pct.x, y: pct.y, zone };
      g.dragging = moved;
      setSores((prev) => prev.map((s) => (s.id === moved.id ? moved : s)));
      setSelectedSore(moved);
      return;
    }

    const u = unitsPerPixel();
    setCamera((c) => ({ ...c, tx: c.tx + dx * u, ty: c.ty + dy * u }));
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g) return;
    const wasTap = !g.moved && g.pointers.size === 1;
    g.pointers.delete(e.pointerId);
    if (g.pointers.size > 0) {
      g.pinchDist = null;
      return;
    }
    gesture.current = null;
    if (!wasTap) return;

    // A tap. On a sore, the marker's own handler already selected it.
    if ((e.target as Element).closest('[data-sore]')) return;

    const p = toDrawing(e.clientX, e.clientY);
    if (mode === 'add') {
      placeSore(p);
    } else {
      setSelectedSore(null);
    }
  };

  /** Add a sore at a point in drawing units; nothing happens off the tissue. */
  const placeSore = (p: Point) => {
    const zone = zoneAt(view, p);
    if (!zone) return;
    const pct = toPercent(p);
    const now = new Date();
    const sore: Sore = {
      id: uuidv4(),
      user_id: user.id ?? '',
      view,
      x: pct.x,
      y: pct.y,
      zone,
      created_at: now.toISOString(),
      healed_at: null,
      readings: [newReading(now)]
    };
    setSores((prev) => [...prev, sore]);
    setSelectedSore(sore);
    // A placed sore is a committed act, unlike a pan or a zoom.
    tap('medium');
  };

  /** Keyboard movement, in percent of the view. Stops at the tissue edge. */
  const nudgeSore = (sore: Sore, dx: number, dy: number) => {
    if (sore.x === null || sore.y === null) return;
    const pct = { x: sore.x + dx, y: sore.y + dy };
    const zone = zoneAt(view, fromPercent(pct));
    if (!zone) return;
    const moved = { ...sore, x: pct.x, y: pct.y, zone };
    setSores((prev) => prev.map((s) => (s.id === moved.id ? moved : s)));
    setSelectedSore(moved);
  };

  const selectSore = (sore: Sore) => {
    setSelectedSore(sore);
  };

  const visible = visibleSores.filter(
    (s) => s.view === view && s.x !== null && s.y !== null
  );

  return (
    <div className="space-y-3">
      {/*
        The view switch. A segmented control rather than a row of links: the
        three views are one property of one object, and the iOS/Android
        idiom for that is a single enclosed track.
      */}
      <div
        role="tablist"
        aria-label="Part of the mouth"
        className="flex gap-1 rounded-xl bg-muted p-1"
      >
        {MOUTH_VIEWS.map((v) => {
          const count = visibleSores.filter((s) => s.view === v).length;
          return (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={view === v}
              onClick={() => {
                if (v !== view) tap();
                setView(v);
                resetCamera();
              }}
              className={cn(
                // 44px tall on touch so a mis-aimed thumb still lands.
                'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors lg:h-9',
                view === v
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {VIEW_LABELS[v]}
              {count > 0 && (
                <span className="tabular rounded-full bg-secondary px-1.5 text-[11px] leading-4 text-secondary-foreground">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="app-card relative overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={viewBoxAttr}
          className={cn(
            'block w-full select-none',
            mode === 'add'
              ? 'cursor-crosshair'
              : 'cursor-grab active:cursor-grabbing'
          )}
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => onPointerDown(e)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label={`${VIEW_LABELS[view]} view of the mouth with ${visible.length} sore${visible.length === 1 ? '' : 's'} marked`}
        >
          <MapDefs p={idPrefix} />
          <g
            transform={`translate(${camera.tx} ${camera.ty}) scale(${camera.k})`}
          >
            <ViewArtwork view={view} p={idPrefix} />
            {visible.map((sore) => {
              const p = fromPercent({ x: sore.x!, y: sore.y! });
              return (
                <SoreMarker
                  key={sore.id}
                  x={p.x}
                  y={p.y}
                  radius={radiusFor(currentSize(sore), view)}
                  pain={currentPain(sore)}
                  label={`${sore.zone}, ${currentSize(sore)} mm, pain ${currentPain(sore)} of 10`}
                  selected={sore.id === selectedSore?.id}
                  draggable={mode !== 'view'}
                  filterId={`${idPrefix}soft`}
                  onSelect={() => selectSore(sore)}
                  onNudge={(dx, dy) => nudgeSore(sore, dx, dy)}
                  onPointerDown={(e) => {
                    selectSore(sore);
                    onPointerDown(
                      e as unknown as React.PointerEvent<SVGSVGElement>,
                      sore
                    );
                  }}
                />
              );
            })}
          </g>
        </svg>

        {mode === 'add' && (
          // Along the bottom edge rather than the top: the top-right corner
          // is the zoom stack, and on a phone the top of the map is where
          // the front teeth are.
          <p className="pointer-events-none absolute inset-x-2 bottom-2 rounded-lg border border-border/60 bg-card/90 px-3 py-2 text-center text-xs text-foreground shadow-sm backdrop-blur">
            Tap where the sore is. Switch tabs for cheeks or lips.
          </p>
        )}

        <MapControls
          onZoomIn={() => zoomCentre(1.25)}
          onZoomOut={() => zoomCentre(0.8)}
          onReset={resetCamera}
          zoomed={camera.k > 1}
        />
      </div>

      {mode === 'add' && (
        // The pointer-free way in. Placing by name drops the sore at the
        // middle of the region; it can be nudged with the arrow keys after.
        <Select
          value=""
          onValueChange={(zone) => {
            const anchor = ZONE_ANCHORS[view].find((a) => a.zone === zone);
            if (anchor) placeSore(anchor.point);
          }}
        >
          <SelectTrigger
            className="h-11 lg:h-10"
            aria-label="Place a sore by naming the part of the mouth"
          >
            <SelectValue placeholder="Or place it by name…" />
          </SelectTrigger>
          <SelectContent>
            {ZONE_ANCHORS[view].map((a) => (
              <SelectItem key={a.zone} value={a.zone}>
                {a.zone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>Shown as in a mirror: your left is on the left.</p>
        {/*
          Only offered once there is something to show. A toggle for an
          empty set is a question with no answer.
        */}
        {healedCount > 0 && (
          <label className="flex shrink-0 cursor-pointer items-center gap-2">
            <span>
              Show healed <span className="tabular">({healedCount})</span>
            </span>
            <Switch
              checked={showHealed}
              onCheckedChange={(on) => {
                tap();
                setShowHealed(on);
                // A healed sore that is selected cannot stay selected once
                // it is hidden.
                if (!on && selectedSore?.healed_at) setSelectedSore(null);
              }}
              aria-label="Show healed sores on the map"
            />
          </label>
        )}
      </div>
    </div>
  );
}
