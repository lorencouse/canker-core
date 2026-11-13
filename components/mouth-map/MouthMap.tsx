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
import { StarMark } from '@/components/graphics/Sparkles';
import SoreQuickCard from '@/components/sore/SoreQuickCard';
import { useActionSheet } from '@/components/ui/action-sheet';
import { Chip } from '@/components/ui/chip';
import { ContextMenu } from '@/components/ui/context-menu';
import { Check, Move, NotebookPen, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { tap } from '@/utils/native';
import {
  currentPain,
  currentSize,
  newReading,
  replaceSore
} from '@/utils/readings';

import { MapDefs, ViewArtwork } from './artwork';
import MapControls from './MapControls';
import { confirmDeleteSore, useMapActions } from './SoreActionBar';
import SoreMarker from './SoreMarker';

/**
 * The mouth map: three flat views (Front, Cheeks, Lips) behind a segmented
 * control, drawn as SVG so it scales, prints, and follows the theme.
 *
 * Interaction model
 *   view mode   tap a sore to open its sheet; press and hold it for a menu
 *               (Log, Healed, Move, Delete); drag to pan; pinch, wheel or
 *               double-tap to zoom (+ / - / 0 keys, or the buttons, which a
 *               mouse sees and a keyboard reaches on touch)
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
/** How long a press on a sore is held before its menu opens. */
const LONG_PRESS_MS = 480;
/** Two taps this close in time and place are a double tap. */
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_PX = 30;
/** How far a double tap zooms in. */
const DOUBLE_TAP_ZOOM = 2.2;

type Camera = { k: number; tx: number; ty: number };
const HOME: Camera = { k: 1, tx: 0, ty: 0 };

export default function MouthMap({
  user,
  initialView,
  placedHint = 'Tap again to move it, or set its reading below.',
  compact = false,
  showMirrorNote = true
}: {
  user: User;
  /** The view to open on when no sore is selected. */
  initialView?: MouthView;
  /** The add-mode line once a sore is placed, for screens that take its reading elsewhere. */
  placedHint?: string;
  /** Short enough to pin above a form: a capped drawing and no hint or footer lines. */
  compact?: boolean;
  /** The "as in a mirror" line under the drawing; the Map tab moves it behind an "i". */
  showMirrorNote?: boolean;
}) {
  const {
    sores,
    setSores,
    visibleSores,
    showHealed,
    setShowHealed,
    selectedSore,
    setSelectedSore,
    mode,
    commitSore,
    placedSore: placed,
    quickOpen,
    setQuickOpen
  } = useSoreContext();
  const healedCount = sores.filter((s) => s.healed_at).length;
  const [view, setView] = useState<MouthView>(
    selectedSore?.view ?? initialView ?? 'front'
  );
  const [camera, setCamera] = useState<Camera>(HOME);
  // The long-press menu: which sore, and where the finger was.
  const [menu, setMenu] = useState<{
    sore: Sore;
    at: { x: number; y: number };
  } | null>(null);
  // Opens the sore's sheet straight on its reading, from the menu's Log.
  const [quickLog, setQuickLog] = useState(false);
  const mapActions = useMapActions();
  const confirm = useActionSheet();
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const holdTimer = useRef<number | undefined>(undefined);
  const svgRef = useRef<SVGSVGElement>(null);
  const idPrefix = useId().replace(/:/g, '');

  // Selecting a sore elsewhere (the details card's arrows) brings its view up.
  // Keyed on the id so switching views by hand is not undone by the next
  // edit to the same sore.
  const [viewedSoreId, setViewedSoreId] = useState(selectedSore?.id);
  if (selectedSore?.id !== viewedSoreId) {
    setViewedSoreId(selectedSore?.id);
    if (selectedSore?.view && selectedSore.view !== view)
      setView(selectedSore.view);
  }

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
    // Whether the press started on a sore. Pointer capture retargets the
    // release to the svg, so the release's own target cannot say.
    onSore: boolean;
    // The press became a long press and opened the menu; its release is not a tap.
    held: boolean;
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
      dragging: null,
      onSore: false,
      held: false
    };
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // Only ever set: the press bubbles from the marker to the svg, whose own
    // handler runs second without a sore.
    if (g.pointers.size === 1 && sore) g.onSore = true;
    if (g.pointers.size === 1 && sore && mode !== 'view') g.dragging = sore;
    window.clearTimeout(holdTimer.current);
    if (g.pointers.size === 1 && sore && mode === 'view' && !compact) {
      const at = { x: e.clientX, y: e.clientY };
      holdTimer.current = window.setTimeout(() => {
        const live = gesture.current;
        if (!live || live.moved) return;
        live.held = true;
        tap('medium');
        setSelectedSore(sore);
        setMenu({ sore, at });
      }, LONG_PRESS_MS);
    }
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
    window.clearTimeout(holdTimer.current);

    if (g.dragging) {
      const p = toDrawing(e.clientX, e.clientY);
      const pct = toPercent(p);
      const zone = zoneAt(view, p);
      if (!zone) return; // Do not let a sore leave the tissue.
      const moved = { ...g.dragging, x: pct.x, y: pct.y, zone };
      g.dragging = moved;
      commitSore(moved);
      return;
    }

    const u = unitsPerPixel();
    setCamera((c) => ({ ...c, tx: c.tx + dx * u, ty: c.ty + dy * u }));
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g) return;
    window.clearTimeout(holdTimer.current);
    const wasTap = !g.moved && !g.held && g.pointers.size === 1;
    g.pointers.delete(e.pointerId);
    if (g.pointers.size > 0) {
      g.pinchDist = null;
      return;
    }
    gesture.current = null;
    if (!wasTap) return;

    // A tap. On a sore, the marker's own handler already selected it; in
    // view mode the tap also opens its quick card. A drag that started on a
    // sore was a pan, so it never gets here.
    if (g.onSore || (e.target as Element).closest('[data-sore]')) {
      if (mode === 'view') {
        setQuickLog(false);
        setQuickOpen(true);
      }
      return;
    }

    const p = toDrawing(e.clientX, e.clientY);
    // A double tap on the drawing zooms in there, or back out when zoomed.
    if (mode === 'view') {
      // The event's own clock: a render must not read the time.
      const now = e.timeStamp;
      const prev = lastTap.current;
      if (
        prev &&
        now - prev.t < DOUBLE_TAP_MS &&
        Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < DOUBLE_TAP_PX
      ) {
        lastTap.current = null;
        if (camera.k > 1.01) resetCamera();
        else {
          const svg = svgRef.current;
          const ctm = svg?.getScreenCTM();
          if (ctm)
            zoomAbout(
              DOUBLE_TAP_ZOOM,
              new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
            );
        }
        return;
      }
      lastTap.current = { t: now, x: e.clientX, y: e.clientY };
    }
    if (mode === 'add') {
      placeSore(p);
    } else {
      setSelectedSore(null);
    }
  };

  /**
   * Add a sore at a point in drawing units; nothing happens off the tissue.
   * With one already placed this session a second tap is almost always "no,
   * there", so it moves that one: two taps used to leave two sores where the
   * person meant one.
   */
  const placeSore = (p: Point) => {
    const zone = zoneAt(view, p);
    if (!zone) return;
    const pct = toPercent(p);
    if (placed) {
      commitSore({ ...placed, view, x: pct.x, y: pct.y, zone });
      tap();
      return;
    }
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
    commitSore({ ...sore, x: pct.x, y: pct.y, zone });
  };

  const visible = visibleSores.filter(
    (s) => s.view === view && s.x !== null && s.y !== null
  );

  return (
    <div className="space-y-3">
      {/*
        The view switch. A segmented control rather than a row of links: the
        three views are one property of one object. A rounded track with the
        chosen view as an indigo pill, like the chips.
      */}
      <div
        role="tablist"
        aria-label="Part of the mouth"
        className="grid grid-cols-3 gap-1 rounded-full border-2 border-border bg-card p-1"
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
                'flex h-11 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-[15px] transition-colors lg:h-10',
                view === v
                  ? 'bg-primary font-bold text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {VIEW_LABELS[v]}
              {count > 0 && <span className="tabular">{count}</span>}
            </button>
          );
        })}
      </div>

      <div
        className="surface-canvas"
        // Zoom from the keyboard while focus is on the map or a sore.
        onKeyDown={(e) => {
          if (e.target instanceof HTMLButtonElement) return;
          if (e.key === '+' || e.key === '=') zoomCentre(1.25);
          else if (e.key === '-' || e.key === '_') zoomCentre(0.8);
          else if (e.key === '0') resetCamera();
          else return;
          e.preventDefault();
        }}
      >
        <svg
          ref={svgRef}
          viewBox={viewBoxAttr}
          className={cn(
            'block w-full select-none',
            compact && 'max-h-[28dvh]',
            mode === 'add'
              ? 'cursor-crosshair'
              : 'cursor-grab active:cursor-grabbing'
          )}
          // No system callout or text selection under a long press.
          style={{ touchAction: 'none', WebkitTouchCallout: 'none' }}
          onContextMenu={(e) => e.preventDefault()}
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
                  onSelect={() => setSelectedSore(sore)}
                  onActivate={() => {
                    setSelectedSore(sore);
                    if (mode === 'view') {
                      setQuickLog(false);
                      setQuickOpen(true);
                    }
                  }}
                  onMenu={
                    mode === 'view' && !compact
                      ? (at) => {
                          setSelectedSore(sore);
                          setMenu({ sore, at });
                        }
                      : undefined
                  }
                  onNudge={(dx, dy) => nudgeSore(sore, dx, dy)}
                  onPointerDown={(e) => {
                    setSelectedSore(sore);
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

        <MapControls
          onZoomIn={() => zoomCentre(1.25)}
          onZoomOut={() => zoomCentre(0.8)}
          onReset={resetCamera}
          zoomed={camera.k > 1}
        />
      </div>

      {mode === 'add' && !compact && (
        // Under the drawing, not on it: a floating hint covered the floor
        // of the mouth on a phone, which is exactly where people tap.
        <p className="text-base font-semibold">
          {placed ? placedHint : 'Tap where the sore is, or name the place.'}
        </p>
      )}

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
            <SelectValue
              placeholder={
                placed ? 'Or move it by name…' : 'Or place it by name…'
              }
            />
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

      <ContextMenu
        at={menu?.at ?? null}
        label={menu ? `${menu.sore.zone} sore` : 'Sore'}
        onClose={() => setMenu(null)}
        items={
          menu
            ? [
                {
                  label: 'Log',
                  icon: NotebookPen,
                  onSelect: () => {
                    setSelectedSore(menu.sore);
                    setQuickLog(true);
                    setQuickOpen(true);
                  }
                },
                ...(menu.sore.healed_at
                  ? []
                  : [
                      {
                        label: 'Healed',
                        icon: Check,
                        onSelect: () =>
                          mapActions.setHealed(
                            new Date().toISOString(),
                            menu.sore
                          )
                      }
                    ]),
                {
                  label: 'Move',
                  icon: Move,
                  onSelect: () => mapActions.begin('edit', menu.sore)
                },
                {
                  label: 'Delete',
                  icon: Trash2,
                  destructive: true,
                  onSelect: async () => {
                    const sore = menu.sore;
                    if (await confirmDeleteSore(confirm.ask))
                      mapActions.remove(sore);
                  }
                }
              ]
            : []
        }
      />
      {confirm.sheet}

      <SoreQuickCard
        startEditing={quickLog}
        sore={mode === 'view' ? selectedSore : null}
        open={quickOpen && mode === 'view' && Boolean(selectedSore)}
        onOpenChange={setQuickOpen}
        onChange={(next) => {
          setSores((prev) => replaceSore(prev, next));
          // A healed sore leaves the map unless healed ones are shown.
          setSelectedSore(next.healed_at && !showHealed ? null : next);
        }}
      />

      <div
        className={cn(
          'flex items-center justify-between gap-3 text-sm text-muted-foreground',
          compact && 'hidden'
        )}
      >
        {/* On the Map tab this sentence sits behind the title's "i". */}
        {showMirrorNote ? (
          <p>As in a mirror: your left is on the left.</p>
        ) : (
          <span />
        )}
        {/*
          Only offered once there is something to show. A toggle for an
          empty set is a question with no answer.
        */}
        {healedCount > 0 && (
          <Chip
            on={showHealed}
            icon={StarMark}
            tone="win"
            onClick={() => {
              tap();
              const on = !showHealed;
              setShowHealed(on);
              // A healed sore that is selected cannot stay selected once
              // it is hidden.
              if (!on && selectedSore?.healed_at) setSelectedSore(null);
            }}
          >
            {`Healed · ${healedCount}`}
          </Chip>
        )}
      </div>
    </div>
  );
}
