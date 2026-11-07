'use client';

import { useId, useState } from 'react';

import { MapDefs, ViewArtwork } from '@/components/mouth-map/artwork';
import type { Sore } from '@/types';
import { cn } from '@/utils/cn';
import {
  MOUTH_VIEWS,
  VIEW_LABELS,
  fromPercent,
  radiusFor,
  viewBoxAttr,
  type MouthView
} from '@/utils/mouth-map/geometry';
import { tap } from '@/utils/native';
import { currentPain, currentSize } from '@/utils/readings';

/**
 * The map pinned above a check-in sore step: the whole mouth with the sore
 * being logged picked out, so it is plain which one the controls below are
 * for. It opens on that sore's view; the other views are a tap away to look
 * at, and moving to the next sore brings its view back.
 *
 * Display only. The sore being logged pulses and carries its name, the ones
 * already logged today show a tick, and the rest fade back.
 */
export default function CheckInMap({
  sores,
  activeId,
  activeReading,
  doneIds
}: {
  /** Every open sore. */
  sores: Sore[];
  activeId: string;
  /** The reading being entered, so the picked-out sore follows the controls. */
  activeReading?: { size: number; pain: number };
  /** Sores logged today, other than the active one. */
  doneIds: ReadonlySet<string>;
}) {
  const p = `${useId().replace(/:/g, '')}-`;
  const active = sores.find((s) => s.id === activeId);
  // A view picked by hand holds only while the same sore is up.
  const [picked, setPicked] = useState<{ for: string; view: MouthView }>();
  const view: MouthView =
    picked?.for === activeId ? picked.view : (active?.view ?? 'front');
  const setView = (v: MouthView) => setPicked({ for: activeId, view: v });

  const placed = sores.filter(
    (s) => s.view === view && s.x !== null && s.y !== null
  );
  // The active sore last, so it draws over any neighbour.
  placed.sort((a, b) => Number(a.id === activeId) - Number(b.id === activeId));

  return (
    <div className="surface-canvas relative">
      <div
        role="tablist"
        aria-label="Part of the mouth"
        className="absolute left-1/2 top-2 z-10 flex -translate-x-1/2 gap-0.5 rounded-full bg-muted p-0.5"
      >
        {MOUTH_VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => {
              if (v !== view) tap();
              setView(v);
            }}
            className={cn(
              'tap-target whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold transition-colors',
              view === v
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground'
            )}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>
      <svg
        viewBox={viewBoxAttr}
        className="mx-auto block h-[min(32dvh,300px)] w-full pt-8"
        role="img"
        aria-label={
          active && active.view === view
            ? `${VIEW_LABELS[view]} view of the mouth, ${active.zone} sore picked out`
            : `${VIEW_LABELS[view]} view of the mouth`
        }
      >
        <MapDefs p={p} />
        <ViewArtwork view={view} p={p} />
        {placed.map((sore) => {
          const { x, y } = fromPercent({ x: sore.x!, y: sore.y! });
          const live = sore.id === activeId ? activeReading : undefined;
          const r = radiusFor(live?.size ?? currentSize(sore), view);
          const level = Math.min(
            10,
            Math.max(1, Math.round(live?.pain ?? currentPain(sore)))
          );
          const fill = `hsl(var(--sev-${level}))`;
          if (sore.id === activeId) {
            // Wide enough for the zone name at this size; approximate is fine.
            const w = 18 + sore.zone.length * 8;
            const below = y + r + 10 + 28 < 400;
            const ty = below ? y + r + 10 : y - r - 38;
            return (
              <g key={sore.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={r + 10}
                  fill="hsl(var(--primary) / 0.25)"
                  className="motion-safe:animate-ping"
                  style={{
                    transformBox: 'fill-box',
                    transformOrigin: 'center'
                  }}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={r + 6}
                  fill="none"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={fill}
                  stroke="white"
                  strokeWidth={2.5}
                />
                <g aria-hidden="true">
                  <rect
                    x={x - w / 2}
                    y={ty}
                    width={w}
                    height={28}
                    rx={14}
                    fill="hsl(var(--foreground))"
                  />
                  <text
                    x={x}
                    y={ty + 19}
                    textAnchor="middle"
                    fill="hsl(var(--background))"
                    className="font-sans text-[15px] font-extrabold"
                  >
                    {sore.zone}
                  </text>
                </g>
              </g>
            );
          }
          const done = doneIds.has(sore.id);
          return (
            <g key={sore.id} opacity={done ? 0.6 : 0.35}>
              <circle cx={x} cy={y} r={r} fill={fill} />
              {done && (
                <path
                  d={`M${x - 5} ${y} l3.5 3.5 l6.5 -7`}
                  stroke="white"
                  strokeWidth={2.6}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
