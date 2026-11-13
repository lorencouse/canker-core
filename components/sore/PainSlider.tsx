'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';

import Kanko from '@/components/kanko/Kanko';
import Measure from '@/components/sore/Measure';
import { cn } from '@/utils/cn';
import { selectionTick } from '@/utils/native';
import { painMood } from '@/utils/ruler';
import { SEVERITY_MAX, SEVERITY_MIN, sevFill } from '@/utils/severity';

const LEVELS = Array.from(
  { length: SEVERITY_MAX - SEVERITY_MIN + 1 },
  (_, i) => SEVERITY_MIN + i
);
/*
 * The three faces were drawn at different framings (a tight head, half a
 * body, a seated full body). Each is scaled and shifted so the head fills
 * the avatar at the same size: `w` is the head's width as a share of the
 * art, `cx`/`cy` its centre, measured off the 640px output.
 */
const FACES = [
  { mood: 'pain-calm', w: 0.76, cx: 0.5, cy: 0.4 },
  { mood: 'pain-uneasy', w: 0.81, cx: 0.5, cy: 0.415 },
  { mood: 'pain-ouch', w: 0.59, cx: 0.5, cy: 0.355 }
] as const;
/** Head width as a share of the avatar. */
const HEAD = 0.96;

/**
 * Pain as one slider over the severity ramp, with a selection tick for
 * every step crossed and Kanko's face following the value.
 *
 * The track is the ramp itself, ten flat steps of the --sev colours, filled
 * up to the answer and faint past it, so the control is also a picture of
 * the reading. The number beside Kanko stays legible while a thumb covers
 * the handle. Radix gives it the slider role, arrow and Page keys, and Home
 * and End.
 *
 * Kanko's three pain faces (calm 1-3, uneasy 4-6, ouch 7-10) are all drawn
 * and cross-faded, so a face never flashes in late on a slow network.
 */
export default function PainSlider({
  id,
  label = 'Pain',
  value,
  onChange
}: {
  id: string;
  label?: string;
  value: number;
  onChange: (pain: number) => void;
}) {
  const mood = painMood(value);
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <span id={`${id}-label`} className="text-base font-semibold">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            // A round avatar: in dark mode the poses are opaque art drawn on
            // slightly different grounds, which a circle tidies.
            className="relative size-14 shrink-0 overflow-hidden rounded-full bg-accent"
          >
            {FACES.map(({ mood: m, w, cx, cy }) => {
              const k = HEAD / w;
              return (
                <span
                  key={m}
                  className={cn(
                    'absolute inset-0 transition-opacity duration-200',
                    m === mood ? 'opacity-100' : 'opacity-0'
                  )}
                  style={{
                    transform: `translate(${(0.5 - cx) * k * 100}%, ${(0.5 - cy) * k * 100}%) scale(${k})`
                  }}
                >
                  <Kanko mood={m} size={56} className="size-14" />
                </span>
              );
            })}
          </span>
          <output
            aria-hidden="true"
            className="tabular min-w-[4.25rem] text-right font-display text-figure font-semibold leading-none"
          >
            <Measure value={value} unit="of 10" />
          </output>
        </div>
      </div>

      <SliderPrimitive.Root
        min={SEVERITY_MIN}
        max={SEVERITY_MAX}
        step={1}
        value={[value]}
        onValueChange={([v]) => {
          if (v === value) return;
          selectionTick();
          onChange(v);
        }}
        className="relative mt-2 flex h-11 w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track className="relative flex h-3 w-full grow gap-0.5 overflow-hidden rounded-full">
          {LEVELS.map((level) => (
            <span
              key={level}
              className="h-full flex-1 transition-opacity"
              style={{
                backgroundColor: sevFill(level),
                opacity: level <= value ? 1 : 0.2
              }}
            />
          ))}
          <SliderPrimitive.Range className="absolute h-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-labelledby={`${id}-label`}
          aria-valuetext={`${value} of 10`}
          className="tap-target block size-8 rounded-full border-[3px] bg-card shadow-menu transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-110"
          style={{ borderColor: sevFill(value) }}
        />
      </SliderPrimitive.Root>
      <div
        aria-hidden="true"
        // Inset by the thumb's radius, where Radix keeps the thumb's centre.
        className="tabular relative mx-4 h-4 text-xs text-muted-foreground"
      >
        {[1, 5, 10].map((n) => (
          <span
            key={n}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${((n - SEVERITY_MIN) / (SEVERITY_MAX - SEVERITY_MIN)) * 100}%` }}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
