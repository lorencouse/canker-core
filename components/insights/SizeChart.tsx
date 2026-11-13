'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Instrument from '@/components/insights/Instrument';
import SoreQuickCard from '@/components/sore/SoreQuickCard';
import { Button } from '@/components/ui/button';
import type { Sore } from '@/types';
import { cn } from '@/utils/cn';
import { shortDate } from '@/utils/dates';
import { daysBetween, parseDay } from '@/utils/days';
import type { SoreDay } from '@/utils/insights';
import { sevFill, SEVERITY_MAX, SEVERITY_MIN } from '@/utils/severity';

/** A column of the plot: a measured day, or a break where days went unlogged. */
type Slot = { kind: 'day'; day: SoreDay } | { kind: 'break' };

/**
 * Days with readings, in order, with one narrow break wherever days went
 * unlogged. Drawing every calendar day would make six weeks of bars too
 * thin to see or tap; the break keeps the gap honest, and the date labels
 * say where each run starts.
 */
export function buildSlots(days: SoreDay[]): Slot[] {
  const slots: Slot[] = [];
  days.forEach((day, i) => {
    if (i > 0 && daysBetween(parseDay(days[i - 1].day), parseDay(day.day)) > 1)
      slots.push({ kind: 'break' });
    slots.push({ kind: 'day', day });
  });
  return slots;
}

/** Slots that get a date under them: run starts, spaced so labels never touch. */
function labelledSlots(slots: Slot[]): Set<number> {
  const out = new Set<number>();
  const gap = Math.max(1, Math.ceil(slots.length / 4));
  let last = -Infinity;
  slots.forEach((slot, i) => {
    const runStart = slot.kind === 'day' && (i === 0 || slots[i - 1].kind === 'break');
    if (runStart && i - last >= gap) {
      out.add(i);
      last = i;
    }
  });
  return out;
}

/** A round top for the scale, so the tallest bar never touches the edge of the plot. */
const scaleTop = (max: number) => Math.max(2, Math.ceil((max + 0.01) / 2) * 2);

const dateLabel = (day: string) => shortDate(parseDay(day));

/**
 * Size over time: one bar per measured day, as tall as the day's largest
 * sore and coloured by its worst pain. Tap, scrub or arrow through the bars
 * and a readout names the day and every sore on it, each one tap from its
 * quick card. The readout spells out the size and the pain, so nothing is
 * carried by colour alone, and the table under the screen holds every value.
 */
export default function SizeChart({ sores, days }: { sores: Sore[]; days: SoreDay[] }) {
  const router = useRouter();
  const readoutId = useId();
  const slots = useMemo(() => buildSlots(days), [days]);
  const labels = useMemo(() => labelledSlots(slots), [slots]);
  const top = scaleTop(Math.max(0, ...days.map((d) => d.size)));

  const [selected, setSelected] = useState<number | null>(null);
  // Roving focus: one bar is in the tab order, the arrows move between them.
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [readoutLeft, setReadoutLeft] = useState(0);
  const scrubbing = useRef(false);

  // A new range is a new set of slots; drop a selection that no longer fits.
  const [slotsFor, setSlotsFor] = useState(slots);
  if (slotsFor !== slots) {
    setSlotsFor(slots);
    setSelected(null);
    setFocusIndex(null);
  }

  const dayIndexes = slots.flatMap((s, i) => (s.kind === 'day' ? [i] : []));
  const tabStop = focusIndex ?? dayIndexes[dayIndexes.length - 1] ?? 0;
  const selectedDay = selected !== null ? slots[selected] : null;

  // Keep the readout over its bar but inside the plot.
  useLayoutEffect(() => {
    if (selected === null) return;
    const bar = barRefs.current[selected];
    const plot = plotRef.current;
    const readout = readoutRef.current;
    if (!bar || !plot || !readout) return;
    const centre = bar.offsetLeft + bar.offsetWidth / 2;
    const max = plot.clientWidth - readout.offsetWidth;
    setReadoutLeft(Math.max(0, Math.min(max, centre - readout.offsetWidth / 2)));
  }, [selected]);

  // A tap anywhere else, or Escape, puts the readout away.
  useEffect(() => {
    if (selected === null) return;
    const away = (e: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setSelected(null);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [selected]);

  const move = (from: number, step: 1 | -1 | 'first' | 'last') => {
    let next: number | undefined;
    if (step === 'first') next = dayIndexes[0];
    else if (step === 'last') next = dayIndexes[dayIndexes.length - 1];
    else {
      const at = dayIndexes.indexOf(from);
      next = dayIndexes[Math.min(dayIndexes.length - 1, Math.max(0, at + step))];
    }
    if (next === undefined) return;
    setFocusIndex(next);
    barRefs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const keys: Record<string, 1 | -1 | 'first' | 'last'> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      Home: 'first',
      End: 'last'
    };
    if (e.key in keys) {
      e.preventDefault();
      move(index, keys[e.key]);
    } else if (e.key === 'Escape') setSelected(null);
  };

  // Drag a finger along the plot to read each day in turn.
  const scrubTo = (e: PointerEvent) => {
    const plot = plotRef.current;
    if (!plot) return;
    const rect = plot.getBoundingClientRect();
    const y = Math.min(rect.bottom - 2, Math.max(rect.top + 2, e.clientY));
    const hit = document.elementFromPoint(e.clientX, y)?.closest<HTMLElement>('[data-slot]');
    const index = hit ? Number(hit.dataset.slot) : NaN;
    if (!Number.isNaN(index)) {
      setSelected(index);
      setFocusIndex(index);
    }
  };

  // The quick card for a sore picked from the readout.
  const [cardId, setCardId] = useState<string | null>(null);
  const [written, setWritten] = useState<Sore | null>(null);
  const [writtenFor, setWrittenFor] = useState(sores);
  if (writtenFor !== sores) {
    setWrittenFor(sores);
    setWritten(null);
  }
  const card =
    (written?.id === cardId ? written : null) ?? sores.find((s) => s.id === cardId) ?? null;

  return (
    <Instrument
      title="Size over time"
      info={
        <>
          <p>Each bar is a day you measured: the largest sore that day, in mm.</p>
          <p>
            Its colour is that day’s worst pain. A gap marks days with no
            reading. Tap or drag across the bars to read them.
          </p>
        </>
      }
    >
      {slots.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">No readings in this range.</p>
      ) : (
        <div ref={rootRef}>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
            {/* The scale: three round steps, the unit on the top one. */}
            <div
              aria-hidden="true"
              className="tabular relative h-40 w-9 text-right text-xs text-muted-foreground"
            >
              <span className="absolute right-0 top-0 -translate-y-1/2 whitespace-nowrap">
                {top} mm
              </span>
              <span className="absolute right-0 top-1/2 -translate-y-1/2">{top / 2}</span>
              <span className="absolute bottom-0 right-0 translate-y-1/2">0</span>
            </div>

            <div
              ref={plotRef}
              className="relative h-40 touch-pan-y"
              onPointerDown={(e) => {
                scrubbing.current = true;
                scrubTo(e);
              }}
              onPointerMove={(e) => scrubbing.current && scrubTo(e)}
              onPointerUp={() => (scrubbing.current = false)}
              onPointerCancel={() => (scrubbing.current = false)}
              onPointerLeave={() => (scrubbing.current = false)}
            >
              {/* Three faint lines at the scale's steps; the baseline is the heavier one. */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border" />
                <div className="absolute inset-x-0 bottom-0 border-t-2 border-border" />
              </div>

              <div
                role="group"
                aria-label="Days measured. Use the arrow keys to move between them."
                className="relative grid h-full gap-x-1"
                style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 2.5rem))` }}
              >
                {slots.map((slot, i) =>
                  slot.kind === 'break' ? (
                    <span key={`b${i}`} data-slot-break aria-hidden="true" />
                  ) : (
                    <button
                      key={slot.day.day}
                      ref={(el) => {
                        barRefs.current[i] = el;
                      }}
                      type="button"
                      data-slot={i}
                      tabIndex={i === tabStop ? 0 : -1}
                      aria-label={barLabel(slot.day)}
                      aria-describedby={selected === i ? readoutId : undefined}
                      onFocus={() => {
                        setFocusIndex(i);
                        setSelected(i);
                      }}
                      onClick={() => setSelected(i)}
                      onKeyDown={(e) => onKeyDown(e, i)}
                      className="group flex h-full min-w-0 items-end justify-center rounded-t-[4px] focus-visible:outline-none"
                    >
                      <span
                        className={cn(
                          'block w-full max-w-7 rounded-t-[4px] transition-opacity group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-card motion-reduce:transition-none',
                          selected !== null && selected !== i && 'opacity-40',
                          selected === i && 'ring-2 ring-foreground ring-offset-2 ring-offset-card'
                        )}
                        style={{
                          // Never shorter than a sliver, so a 0 mm day still shows it was measured.
                          height: `${Math.max(2, (slot.day.size / top) * 100)}%`,
                          backgroundColor: sevFill(slot.day.pain)
                        }}
                      />
                    </button>
                  )
                )}
              </div>

              {selectedDay?.kind === 'day' && (
                <div
                  ref={readoutRef}
                  id={readoutId}
                  className="absolute bottom-full z-10 mb-2 w-max min-w-40 max-w-[min(16rem,100%)] rounded-cell border border-border bg-popover p-2.5 text-popover-foreground shadow-lg"
                  style={{ left: readoutLeft }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <p className="tabular text-sm font-semibold">{dateLabel(selectedDay.day.day)}</p>
                  <ul className="mt-1">
                    {selectedDay.day.sores.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setCardId(s.id)}
                          className="focus-ring grid min-h-9 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-cell px-1 text-left text-sm press [--press-scale:0.98] hover:bg-muted coarse:min-h-11"
                        >
                          <span
                            aria-hidden="true"
                            className="size-2.5 rounded-full ring-1 ring-foreground/20"
                            style={{ backgroundColor: sevFill(s.pain) }}
                          />
                          <span className="truncate">{s.zone}</span>
                          <span className="tabular whitespace-nowrap text-muted-foreground">
                            {s.size} mm, pain {s.pain}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Dates under the run starts, on the plot's own columns. */}
            <div aria-hidden="true" />
            <div
              aria-hidden="true"
              className="tabular mt-1.5 grid h-4 gap-x-1 text-xs text-muted-foreground"
              style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 2.5rem))` }}
            >
              {slots.map((slot, i) =>
                labels.has(i) && slot.kind === 'day' ? (
                  <span
                    key={i}
                    className="whitespace-nowrap"
                    style={{
                      gridColumnStart: i + 1,
                      gridRowStart: 1,
                      // Late labels hang left from their bar so they stay inside the card.
                      justifySelf: i > slots.length * 0.6 ? 'end' : 'start'
                    }}
                  >
                    {dateLabel(slot.day.day)}
                  </span>
                ) : null
              )}
            </div>
          </div>

          <PainKey />
        </div>
      )}

      <SoreQuickCard
        sore={card}
        open={card !== null}
        onOpenChange={(open) => !open && setCardId(null)}
        // The page's data comes from the server, so a write refreshes it.
        onChange={(next) => {
          setWritten(next);
          router.refresh();
        }}
        footer={
          card && (
            <Button asChild variant="link" className="h-11 px-0.5 text-base font-semibold">
              <Link href={`/my-sores?sore=${card.id}`}>Show on map</Link>
            </Button>
          )
        }
      />
    </Instrument>
  );
}

const barLabel = (d: SoreDay) =>
  `${dateLabel(d.day)}: ${d.size} mm, pain ${d.pain}` +
  (d.sores.length > 1 ? `, ${d.sores.length} sores` : '');

/** The colour key: the pain ramp, its two ends labelled. */
function PainKey() {
  const steps = Array.from(
    { length: SEVERITY_MAX - SEVERITY_MIN + 1 },
    (_, i) => SEVERITY_MIN + i
  );
  return (
    <div className="tabular mt-3 flex items-center gap-2 text-xs text-muted-foreground">
      <span>Pain</span>
      <span>{SEVERITY_MIN}</span>
      <span aria-hidden="true" className="flex gap-0.5">
        {steps.map((s) => (
          <span key={s} className="size-2.5 rounded-full" style={{ backgroundColor: sevFill(s) }} />
        ))}
      </span>
      <span>{SEVERITY_MAX}</span>
    </div>
  );
}
