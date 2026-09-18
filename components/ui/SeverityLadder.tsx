'use client';

import { SEVERITY_MAX, SEVERITY_MIN } from '@/utils/getColor';
import { cn } from '@/utils/cn';

/*
 * Ten keys, not a slider.
 *
 * A slider hides the scale behind its own thumb, needs a drag to operate,
 * and on a phone the difference between a 6 and a 7 is about four pixels of
 * thumb travel - so the value people record is the one that was easy to hit,
 * not the one they meant. Ten keys show the whole ramp at once, land in a
 * single tap, and let the ramp itself do the explaining: every key up to the
 * chosen one is filled, so the control is also a picture of the answer.
 */

const LEVELS = Array.from(
  { length: SEVERITY_MAX - SEVERITY_MIN + 1 },
  (_, i) => SEVERITY_MIN + i
);

type Props = {
  value: number | null;
  onChange: (pain: number) => void;
  /** Names the group for a screen reader. */
  label?: string;
  disabled?: boolean;
  className?: string;
};

export default function SeverityLadder({
  value,
  onChange,
  label = 'Pain today',
  disabled,
  className
}: Props) {
  return (
    <div
      role="group"
      aria-label={`${label}, 1 to ${SEVERITY_MAX}`}
      className={cn('flex gap-[3px]', className)}
    >
      {LEVELS.map((level) => {
        const filled = value !== null && level <= value;
        const picked = value === level;

        return (
          <button
            key={level}
            type="button"
            disabled={disabled}
            aria-pressed={picked}
            onClick={() => onChange(level)}
            /*
             * 48px clears both Apple's 44pt and Android's 48dp minimum, and
             * steps back on a pointer device so a desktop form is not built
             * out of slabs.
             */
            className={cn(
              'h-12 min-w-0 flex-1 border-2 border-rule bg-card font-display',
              'text-sm font-semibold tabular text-muted-foreground',
              'transition-colors focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring focus-visible:ring-offset-2',
              'focus-visible:ring-offset-background disabled:opacity-50',
              'lg:h-10'
            )}
            style={
              filled
                ? {
                    backgroundColor: `hsl(var(--sev-${level}))`,
                    // Pale rungs keep dark ink; deep ones flip to white.
                    color: `hsl(var(--sev-ink-${level > 5 ? 'hi' : 'lo'}))`
                  }
                : undefined
            }
          >
            {level}
          </button>
        );
      })}
    </div>
  );
}
