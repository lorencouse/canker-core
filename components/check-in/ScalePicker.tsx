'use client';

import { cn } from '@/utils/cn';
import { tap } from '@/utils/native';

const POINTS = [1, 2, 3, 4, 5] as const;

/**
 * The look of one answer key on the habit steps: rounded like the chips,
 * and picked as a solid indigo key on its pressable edge, so the answer
 * reads from across the sheet. Shared by the 1 to 5 scales and the sleep
 * hours, so every number on the check-in is one kind of control.
 */
export const answerKeyClass = (on: boolean) =>
  cn(
    'tabular h-12 min-w-0 rounded-full border-2 font-display text-lg font-semibold press',
    'focus-ring disabled:opacity-50',
    on
      ? 'border-primary bg-primary text-primary-foreground shadow-press'
      : 'border-control bg-card text-foreground hover:bg-muted'
  );

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
  disabled,
  note
}: {
  label: string;
  /** What 1 means. */
  low: string;
  /** What 5 means. */
  high: string;
  value: number | null;
  onChange: (next: number | null) => void;
  disabled?: boolean;
  /** A line under the scale, such as which answers count against the streak. */
  note?: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-base font-semibold">{label}</legend>
      <div className="grid grid-cols-5 gap-2">
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
              className={answerKeyClass(on)}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div
        aria-hidden="true"
        className="flex justify-between gap-3 pt-1 text-sm text-muted-foreground"
      >
        <span className="min-w-0 truncate">{low}</span>
        <span className="min-w-0 truncate text-right">{high}</span>
      </div>
      {note && (
        <p className="prose-measure text-sm text-muted-foreground">{note}</p>
      )}
    </fieldset>
  );
}
