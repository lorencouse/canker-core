import type { Sore } from '@/types';
import { cn } from '@/utils/cn';
import { courseOf, type CourseDay } from '@/utils/course';

/**
 * A sore's whole course as one row of days.
 *
 * Each cell is a calendar day, filled from the severity ramp. Days with no
 * reading are drawn hollow rather than skipped: a gap is the record saying
 * nothing was logged, and closing it up would make a patchy history look as
 * complete as a diligent one — which is exactly the thing the strip is
 * meant to make visible.
 *
 * Cells are square-cornered on purpose. Every other rounded thing in the
 * app is a surface or a control; a measurement should not look tappable.
 */

/** Squares stay square: the row grows by adding days, not by stretching. */
const SIZES = {
  /** In a table row or a card header. */
  sm: { cell: 'h-2.5 w-2.5', gap: 'gap-[2px]' },
  /** As the subject of a detail view. */
  md: { cell: 'h-4 w-4', gap: 'gap-[3px]' }
} as const;

/**
 * Spoken instead of the drawing. A sparkline read cell by cell is noise, so
 * this is the summary a person would give: how long, how much was logged,
 * and where the pain started and ended up.
 */
function summarise(days: CourseDay[]): string {
  const logged = days.filter((d) => d.pain !== null);
  if (!logged.length) return `${days.length} days, nothing logged yet.`;
  const first = logged[0].pain!;
  const last = logged[logged.length - 1].pain!;
  const arc =
    logged.length === 1
      ? `pain ${last} of 10`
      : `pain ${first} of 10 at the start, ${last} at the last reading`;
  return `${days.length} day${days.length === 1 ? '' : 's'}, ${logged.length} logged. ${arc}.`;
}

export default function CourseStrip({
  sore,
  size = 'sm',
  animateLast = false,
  className
}: {
  sore: Sore;
  size?: keyof typeof SIZES;
  /**
   * Pop the most recent cell in. Set for a moment after a check-in is
   * saved, so the press has a visible consequence beyond a toast — never
   * on a plain render, or every navigation would twitch.
   */
  animateLast?: boolean;
  className?: string;
}) {
  const days = courseOf(sore);
  const { cell, gap } = SIZES[size];
  const lastIndex = days.length - 1;

  return (
    <div
      role="img"
      aria-label={`Course: ${summarise(days)}`}
      className={cn('flex flex-wrap items-end', gap, className)}
    >
      {days.map((day, i) => (
        <span
          key={day.day}
          // Hover on a desktop; harmless everywhere else. The strip is a
          // summary, and the exact numbers live in the chart below it.
          title={
            day.pain === null
              ? `Day ${day.n} — not logged`
              : `Day ${day.n} — ${day.size} mm, pain ${day.pain} of 10`
          }
          className={cn(
            cell,
            'rounded-cell',
            animateLast && i === lastIndex && 'animate-commit',
            /*
             * A hairline on filled cells. The ramp's pale end sits about six
             * points of lightness from the instrument it is drawn on, which
             * is plenty at swatch size and thin at ten pixels — so a pain-1
             * day needs an edge to be a mark rather than a smudge. Cheaper
             * and more honest than steepening a ramp that is already evenly
             * stepped.
             */
            day.pain !== null && 'ring-1 ring-inset ring-foreground/15',
            day.pain === null && 'border border-dashed border-border',
            // The healed day closes the course, so it reads as neutral ink
            // rather than as one more day of pain.
            day.isHealedDay && 'bg-foreground/25'
          )}
          style={
            day.pain !== null && !day.isHealedDay
              ? { backgroundColor: `hsl(var(--sev-${day.pain}))` }
              : undefined
          }
        />
      ))}
    </div>
  );
}
