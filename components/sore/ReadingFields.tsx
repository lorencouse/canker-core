'use client';

import type { ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import SeverityLadder from '@/components/ui/SeverityLadder';
import { Slider } from '@/components/ui/slider';
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
export const WIDTH_STEP = 0.5;
export const MIN_WIDTH = 0.5;
export const MAX_WIDTH = 20;

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
        {value}{' '}
        <small className="font-sans text-sm font-normal text-muted-foreground">
          {unit}
        </small>
      </output>
    </div>
  );
}

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

function Stepper({
  label,
  onClick,
  disabled,
  children
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
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
      className="h-12 w-full px-0 [&_svg]:size-5"
    >
      {children}
    </Button>
  );
}
