'use client';

import * as React from 'react';

import { cn } from '../lib/cn';
import { Slider } from './slider';

export interface LevelAnchor {
  at: number;
  label: string;
}

export interface LevelSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Descriptive anchors; the highest anchor with `at <= value` is shown under the number. */
  anchors?: ReadonlyArray<LevelAnchor>;
  /** Format the displayed number (default: the raw value). */
  format?: (value: number) => string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function anchorFor(
  anchors: ReadonlyArray<LevelAnchor> | undefined,
  value: number
): string | null {
  if (!anchors || anchors.length === 0) return null;
  let label: string | null = null;
  for (const a of anchors) if (value >= a.at) label = a.label;
  return label ?? anchors[0]?.label ?? null;
}

/**
 * Slider with a large display-font readout and the matching anchor label.
 * The readout uses tabular digits so it does not jitter as the value changes.
 */
function LevelSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  anchors,
  format,
  disabled,
  className,
  id
}: LevelSliderProps) {
  const reactId = React.useId();
  const labelId = id ?? `level-slider-${reactId}`;
  const anchor = anchorFor(anchors, value);
  const shown = format ? format(value) : String(value);
  const valueText = anchor ? `${shown}, ${anchor}` : shown;

  return (
    <div
      data-slot="level-slider"
      role="group"
      aria-labelledby={labelId}
      className={cn('flex flex-col gap-3', className)}
    >
      <div className="flex items-end justify-between gap-4">
        <span id={labelId} className="text-secondary-foreground text-sm font-medium">
          {label}
        </span>
        <span
          className="tabular font-display text-foreground text-4xl font-semibold leading-none"
          aria-hidden
        >
          {shown}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(next) => {
          const v = next[0];
          if (v !== undefined && v !== value) onChange(v);
        }}
        thumbProps={{ 'aria-label': label, 'aria-valuetext': valueText }}
      />
      <div className="text-muted-foreground flex min-h-5 items-start justify-between gap-2 text-xs">
        <span className="tabular">{format ? format(min) : min}</span>
        <span
          className="text-secondary-foreground text-center font-medium"
          aria-live="polite"
        >
          {anchor}
        </span>
        <span className="tabular">{format ? format(max) : max}</span>
      </div>
    </div>
  );
}

export { LevelSlider };
