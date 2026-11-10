'use client';

import type { ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';

import Measure from '@/components/sore/Measure';
import { Button } from '@/components/ui/button';
import SeverityLadder from '@/components/ui/SeverityLadder';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/utils/cn';
import { tap } from '@/utils/native';

/**
 * The two readings, as the controls that enter them. Shared by the Today
 * card and the map's "Log today" so a reading is taken the same way
 * wherever it is taken.
 *
 * Width is a continuous measurement, so it is a slider, with half-step
 * buttons either side because a thumb cannot land a slider on 3.5. Pain is
 * ten named steps: the ladder shows all ten and lands in one tap, where a
 * slider would hide the scale behind its own thumb.
 */

/** Width moves in half millimetres, which is as fine as anyone can judge one. */
const WIDTH_STEP = 0.5;
const MIN_WIDTH = 0.5;
const MAX_WIDTH = 20;

const clampWidth = (mm: number) =>
  Math.min(
    MAX_WIDTH,
    Math.max(MIN_WIDTH, Math.round(mm / WIDTH_STEP) * WIDTH_STEP)
  );

function FieldHead({
  label,
  htmlFor,
  id,
  value,
  unit
}: {
  label: string;
  htmlFor?: string;
  id?: string;
  value: number;
  unit: string;
}) {
  const Label = htmlFor ? 'label' : 'span';
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Label id={id} htmlFor={htmlFor} className="text-base font-semibold">
        {label}
      </Label>
      {/* The reading, not a tooltip on the handle: it has to stay legible
          while a thumb is covering the handle. */}
      <output
        htmlFor={htmlFor}
        className="tabular font-display text-xl font-semibold leading-none"
      >
        <Measure value={value} unit={unit} />
      </output>
    </div>
  );
}

/**
 * The widths most sores actually are, offered as one-tap answers. The
 * slider runs to 20mm for the rare major ulcer, which leaves the common
 * range a few pixels per step under a thumb; these land it in one tap, and
 * the slider and steppers stay for anything in between.
 */
const WIDTH_PRESETS = [1, 2, 3, 5, 8] as const;

export function WidthField({
  id,
  label = 'Width today',
  value,
  onChange
}: {
  id: string;
  label?: string;
  value: number;
  onChange: (mm: number) => void;
}) {
  const set = (mm: number) => onChange(clampWidth(mm));
  return (
    <div>
      <FieldHead label={label} htmlFor={id} value={value} unit="mm" />
      <div
        role="group"
        aria-label={`${label}, common sizes`}
        className="mt-2 grid grid-cols-5 gap-1.5"
      >
        {WIDTH_PRESETS.map((mm) => {
          const picked = value === mm;
          return (
            <button
              key={mm}
              type="button"
              aria-pressed={picked}
              aria-label={`${mm} mm`}
              onClick={() => {
                tap();
                set(mm);
              }}
              className={cn(
                // Dot over figure; 56px tall so the 8mm dot has room.
                'flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-cell border-2 bg-card transition-colors',
                'focus-ring',
                picked
                  ? 'border-primary bg-accent text-foreground'
                  : 'border-control text-muted-foreground hover:bg-muted'
              )}
            >
              {/* Drawn in CSS millimetres, so on most screens each dot is
                  about the size it names: easier to match than a number. */}
              <span
                aria-hidden="true"
                className="block shrink-0 rounded-full bg-current"
                style={{ width: `${mm}mm`, height: `${mm}mm` }}
              />
              <span className="tabular text-xs font-semibold leading-none">
                {mm}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] items-center gap-2.5">
        <Stepper
          label="Half a millimetre narrower"
          onClick={() => set(value - WIDTH_STEP)}
          disabled={value <= MIN_WIDTH}
        >
          <Minus aria-hidden="true" />
        </Stepper>
        <Slider
          id={id}
          min={MIN_WIDTH}
          max={MAX_WIDTH}
          step={WIDTH_STEP}
          value={[value]}
          onValueChange={([v]) => set(v)}
          aria-label="Width in millimetres"
        />
        <Stepper
          label="Half a millimetre wider"
          onClick={() => set(value + WIDTH_STEP)}
          disabled={value >= MAX_WIDTH}
        >
          <Plus aria-hidden="true" />
        </Stepper>
      </div>
    </div>
  );
}

export function PainField({
  id,
  label = 'Pain today',
  value,
  onChange
}: {
  id: string;
  label?: string;
  value: number;
  onChange: (pain: number) => void;
}) {
  return (
    <div>
      <FieldHead label={label} id={id} value={value} unit="of 10" />
      <SeverityLadder
        className="mt-2"
        value={value}
        label={label}
        onChange={(v) => {
          tap();
          onChange(v);
        }}
      />
    </div>
  );
}

export function Stepper({
  label,
  onClick,
  disabled,
  className,
  children
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        tap();
        onClick();
      }}
      disabled={disabled}
      aria-label={label}
      className={cn('h-12 w-full px-0 [&_svg]:size-5', className)}
    >
      {children}
    </Button>
  );
}

/** The check-in's one-tap widths: nearly every sore is one of these. */
const QUICK_WIDTHS = [1, 2, 3, 4, 5, 6] as const;

/**
 * Width as taps only, for the check-in, where the map sits above and there
 * is no room to drag a slider: the six common widths in one row, and half
 * steps either side of the reading for anything else (up to the same 20mm).
 */
export function QuickWidthField({
  label = 'Width',
  value,
  onChange
}: {
  label?: string;
  value: number;
  onChange: (mm: number) => void;
}) {
  const set = (mm: number) => onChange(clampWidth(mm));
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-base font-semibold">{label}</span>
        <div className="flex items-center gap-1.5">
          <Stepper
            label="Half a millimetre narrower"
            onClick={() => set(value - WIDTH_STEP)}
            disabled={value <= MIN_WIDTH}
            className="h-11 w-11"
          >
            <Minus aria-hidden="true" />
          </Stepper>
          <output
            aria-live="polite"
            className="tabular min-w-[4.5rem] text-center font-display text-xl font-semibold leading-none"
          >
            <Measure value={value} unit="mm" />
          </output>
          <Stepper
            label="Half a millimetre wider"
            onClick={() => set(value + WIDTH_STEP)}
            disabled={value >= MAX_WIDTH}
            className="h-11 w-11"
          >
            <Plus aria-hidden="true" />
          </Stepper>
        </div>
      </div>
      <div
        role="group"
        aria-label={`${label}, common sizes`}
        className="mt-2 grid grid-cols-6 gap-1.5"
      >
        {QUICK_WIDTHS.map((mm) => {
          const picked = value === mm;
          return (
            <button
              key={mm}
              type="button"
              aria-pressed={picked}
              aria-label={`${mm} mm`}
              onClick={() => {
                tap();
                set(mm);
              }}
              className={cn(
                'flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-cell border-2 transition-colors',
                'focus-ring',
                picked
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-control bg-card text-foreground hover:bg-muted'
              )}
            >
              <span className="tabular text-base font-bold leading-none">
                {mm}
              </span>
              <span
                className={cn(
                  'text-[11px] font-semibold leading-none',
                  picked ? 'text-primary-foreground' : 'text-muted-foreground'
                )}
              >
                mm
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
