'use client';

import type React from 'react';
import { useEffect, useId, useRef } from 'react';

import Measure from '@/components/sore/Measure';
import { cn } from '@/utils/cn';
import { selectionTick } from '@/utils/native';
import {
  WIDTH_MAX,
  WIDTH_MIN,
  WIDTH_STEP,
  clampWidth,
  rulerIndex,
  rulerValue
} from '@/utils/ruler';

/** Pixels between two half-millimetre ticks. */
const TICK = 12;
const TICKS = rulerIndex(WIDTH_MAX) + 1;

/**
 * Width as one control: a ruler slid under a fixed needle, as a tape measure
 * or the system's own wheel pickers are, with a selection tick per half
 * millimetre crossed.
 *
 * It is a native scroller with snap points, so a flick carries on and
 * settles on a tick the way a wheel does, with no animation code. A tap on
 * the ruler moves straight to the tick under it (the single-pointer
 * alternative to dragging), and the scroller is itself the slider for a
 * keyboard and a screen reader: arrows step half a millimetre, Page keys
 * two, Home and End the ends.
 */
export default function WidthRuler({
  label = 'Width',
  value,
  onChange
}: {
  label?: string;
  value: number;
  onChange: (mm: number) => void;
}) {
  const labelId = useId();
  const ref = useRef<HTMLDivElement>(null);
  // While the ruler is scrolled by code, its scroll events are not answers.
  const settingTo = useRef<number | null>(null);
  const last = useRef(value);
  const frame = useRef(0);
  const mouse = useRef<{ x: number; left: number; moved: boolean } | null>(
    null
  );

  const scrollToValue = (mm: number, smooth: boolean) => {
    const el = ref.current;
    if (!el) return;
    const left = rulerIndex(mm) * TICK;
    if (Math.abs(el.scrollLeft - left) < 1) return;
    settingTo.current = left;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left, behavior: smooth && !reduce ? 'smooth' : 'auto' });
    // A smooth scroll that is interrupted never arrives; stop waiting.
    window.setTimeout(() => {
      if (settingTo.current === left) settingTo.current = null;
    }, 600);
  };

  // Mount at the reading, and follow it when it changes from outside.
  useEffect(() => {
    if (value !== last.current || settingTo.current === null) {
      last.current = value;
      scrollToValue(value, false);
    }
  }, [value]);

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      if (settingTo.current !== null) {
        if (Math.abs(el.scrollLeft - settingTo.current) < 1)
          settingTo.current = null;
        return;
      }
      const next = rulerValue(Math.round(el.scrollLeft / TICK));
      if (next !== last.current) {
        last.current = next;
        selectionTick();
        onChange(next);
      }
    });
  };

  const step = (mm: number) => {
    const next = clampWidth(mm);
    if (next === value) return;
    last.current = next;
    selectionTick();
    onChange(next);
    scrollToValue(next, true);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowLeft: value - WIDTH_STEP,
      ArrowDown: value - WIDTH_STEP,
      ArrowRight: value + WIDTH_STEP,
      ArrowUp: value + WIDTH_STEP,
      PageDown: value - 2,
      PageUp: value + 2,
      Home: WIDTH_MIN,
      End: WIDTH_MAX
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    step(moves[e.key]);
  };

  /** A tap lands the tick under the finger on the needle. */
  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mouse.current?.moved) return;
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const fromNeedle = e.clientX - (box.left + box.width / 2);
    step(value + Math.round(fromNeedle / TICK) * WIDTH_STEP);
  };

  // A mouse cannot flick a scroller, so it drags it instead.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    mouse.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const m = mouse.current;
    if (!m || !ref.current) return;
    const dx = e.clientX - m.x;
    if (Math.abs(dx) > 3) {
      if (!m.moved) ref.current.setPointerCapture(e.pointerId);
      m.moved = true;
    }
    if (m.moved) ref.current.scrollLeft = m.left - dx;
  };
  const onPointerUp = () => {
    // Read by the click that follows this release, then cleared.
    window.setTimeout(() => (mouse.current = null), 0);
  };

  return (
    // min-w-0: the ruler is far wider than the screen and scrolls inside
    // its box; a grid or flex parent would otherwise grow to fit it.
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <span id={labelId} className="text-base font-semibold">
          {label}
        </span>
        <output
          aria-hidden="true"
          className="tabular font-display text-figure font-semibold leading-none"
        >
          <Measure value={value} unit="mm" />
        </output>
      </div>
      <div className="relative mt-2 min-w-0" data-no-sheet-drag="">
        <div
          ref={ref}
          role="slider"
          tabIndex={0}
          aria-labelledby={labelId}
          aria-valuemin={WIDTH_MIN}
          aria-valuemax={WIDTH_MAX}
          aria-valuenow={value}
          aria-valuetext={`${value} millimetres`}
          aria-orientation="horizontal"
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          onClick={onClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn(
            'focus-ring flex h-16 w-full cursor-grab snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-cell bg-muted active:cursor-grabbing',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          )}
        >
          <span
            aria-hidden="true"
            className="shrink-0"
            style={{ width: `calc(50% - ${TICK / 2}px)` }}
          />
          {Array.from({ length: TICKS }, (_, i) => {
            const mm = rulerValue(i);
            const whole = Number.isInteger(mm);
            const near = Math.abs(mm - value) < WIDTH_STEP / 2;
            return (
              <span
                key={i}
                aria-hidden="true"
                className="relative flex shrink-0 snap-center flex-col items-center pt-2"
                style={{ width: TICK }}
              >
                <span
                  className={cn(
                    'block w-0.5 rounded-full transition-colors',
                    whole ? 'h-6' : 'h-3.5',
                    near
                      ? 'bg-primary'
                      : whole
                        ? 'bg-foreground/55'
                        : 'bg-control/60'
                  )}
                />
                {whole && (
                  <span
                    className={cn(
                      'tabular mt-1 text-xs leading-none',
                      near
                        ? 'font-bold text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {mm}
                  </span>
                )}
              </span>
            );
          })}
          <span
            aria-hidden="true"
            className="shrink-0"
            style={{ width: `calc(50% - ${TICK / 2}px)` }}
          />
        </div>
        {/* The needle: fixed, while the ruler moves under it. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1 h-9 w-1 -translate-x-1/2 rounded-full bg-primary"
        />
      </div>
    </div>
  );
}
