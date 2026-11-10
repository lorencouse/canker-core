'use client';

import { cn } from '@/utils/cn';
import { tap } from '@/utils/native';

const POINTS = [1, 2, 3, 4, 5] as const;

/**
 * A 1 to 5 answer in one tap, with the ends named so the numbers mean
 * something. Tapping the picked point again clears it: the scale is
 * optional, and there is no other way back to "no answer".
 */
export default function ScalePicker({
  label,
  low,
  high,
  value,
  onChange,
  disabled
}: {
  label: string;
  /** What 1 means. */
  low: string;
  /** What 5 means. */
  high: string;
  value: number | null;
  onChange: (next: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-base font-semibold">{label}</legend>
      <div className="grid grid-cols-5 gap-1.5">
        {POINTS.map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              aria-label={`${n} of 5${n === 1 ? `, ${low}` : n === 5 ? `, ${high}` : ''}`}
              disabled={disabled}
              onClick={() => {
                tap();
                onChange(on ? null : n);
              }}
              className={cn(
                'tabular h-12 min-w-0 rounded-cell border-2 bg-card font-display text-lg font-semibold transition-colors',
                'focus-ring',
                'disabled:opacity-50',
                on
                  ? 'border-primary bg-accent text-foreground'
                  : 'border-control text-muted-foreground hover:bg-muted'
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div
        aria-hidden="true"
        className="flex justify-between gap-3 text-sm text-muted-foreground"
      >
        <span className="min-w-0 truncate">{low}</span>
        <span className="min-w-0 truncate text-right">{high}</span>
      </div>
    </fieldset>
  );
}
