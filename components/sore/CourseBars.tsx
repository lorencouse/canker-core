import type { Sore } from '@/types';
import { cn } from '@/utils/cn';
import { courseOf, type CourseDay } from '@/utils/course';
import { shortDate } from '@/utils/dates';

/**
 * A sore's course drawn to scale: one slot per day, bar height for width,
 * colour for that day's pain.
 *
 * The strip of squares (CourseStrip) answers "how much was logged"; this
 * answers "is it getting smaller", which is the question a person opening
 * the app is asking. Height is millimetres against a fixed axis rather than
 * against the sore's own peak, so a 2mm sore never looks as big as a 6mm
 * one.
 *
 * An open sore is drawn against a fortnight, the ordinary course, so the
 * days still to come show as empty dashed slots and today sits where it
 * falls in the two weeks. A day with no reading is a full-height grey slot
 * rather than a gap: the record saying nothing was logged is information.
 */

/** The ordinary course of a minor ulcer, and the width of the strip. */
const FORTNIGHT = 14;

/** Millimetres at the top of the axis. Grows in 2mm steps for a wide sore. */
function axisMax(days: CourseDay[], base: number) {
  const widest = Math.max(0, ...days.map((d) => d.size ?? 0));
  return Math.max(base, Math.ceil(widest / 2) * 2);
}

/** Slots the strip draws: a fortnight for an open sore, or more once it runs past one. */
export function courseSlots(sore: Sore, days: CourseDay[]): number {
  return sore.healed_at ? days.length : Math.max(FORTNIGHT, days.length);
}

/** The words a screen reader gets instead of the bars. */
export function describeCourse(days: CourseDay[]): string {
  const logged = days.filter((d) => d.size !== null);
  if (!logged.length)
    return `${days.length} day${days.length === 1 ? '' : 's'}, nothing logged yet.`;
  const widths = logged.map((d) => d.size).join(', ');
  const first = logged[0].pain!;
  const last = logged[logged.length - 1].pain!;
  const pain =
    logged.length === 1
      ? `pain ${last}`
      : `pain ${first} at the start and ${last} at the last reading`;
  return `${days.length} day${days.length === 1 ? '' : 's'}, ${logged.length} logged. Widths ${widths} mm; ${pain}.`;
}

export default function CourseBars({
  sore,
  height = 64,
  axis = false,
  base = axis ? 8 : 6,
  animateLast = false,
  now = new Date(),
  className
}: {
  sore: Sore;
  /** Bar area height in px. */
  height?: number;
  /** Draw the millimetre axis and dated day labels, for the detail view. */
  axis?: boolean;
  /** Millimetres at the top of the axis before a wide sore stretches it. */
  base?: number;
  /** Pop today's bar in, for a moment after Save. */
  animateLast?: boolean;
  now?: Date;
  className?: string;
}) {
  const days = courseOf(sore, now);
  const open = !sore.healed_at;
  const slots = courseSlots(sore, days);
  const max = axisMax(days, base);
  const todayIndex = open ? days.length - 1 : -1;
  const label = describeCourse(days);

  const bars = (
    <div
      role="img"
      aria-label={`Width by day: ${label}`}
      className={cn(
        'grid items-end gap-[3px]',
        axis && 'border-b border-control'
      )}
      style={{
        gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))`,
        height
      }}
    >
      {Array.from({ length: slots }, (_, i) => {
        const day = days[i];
        if (!day) {
          // A day this course has not reached yet.
          return (
            <span
              key={`slot-${i}`}
              className="h-full border border-b-0 border-dashed border-border"
            />
          );
        }
        const today = i === todayIndex;
        const ring =
          today && 'outline outline-2 outline-offset-1 outline-foreground';
        if (day.size === null || day.isHealedDay) {
          return (
            <span
              key={day.day}
              title={`Day ${day.n}: ${day.isHealedDay ? 'healed' : 'not logged'}`}
              className={cn(
                'h-full',
                day.isHealedDay ? 'bg-foreground/25' : 'bg-muted',
                ring
              )}
            />
          );
        }
        return (
          <span
            key={day.day}
            title={`Day ${day.n}: ${day.size} mm, pain ${day.pain} of 10`}
            className={cn(
              'min-h-1',
              ring,
              animateLast && today && 'origin-bottom animate-commit'
            )}
            style={{
              height: `${Math.min(100, (day.size / max) * 100)}%`,
              backgroundColor: `hsl(var(--sev-${day.pain}))`
            }}
          />
        );
      })}
    </div>
  );

  if (!axis) return <div className={className}>{bars}</div>;

  const start = new Date(sore.created_at);
  return (
    <div className={className}>
      <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-1.5">
        <div
          aria-hidden="true"
          className="tabular flex flex-col justify-between text-right text-xs text-muted-foreground"
          style={{ height }}
        >
          <span>{max}</span>
          <span>{max / 2}</span>
          <span>0</span>
        </div>
        {bars}
      </div>
      <div
        aria-hidden="true"
        className="tabular ml-[2.125rem] mt-1 flex justify-between gap-2 text-xs text-muted-foreground"
      >
        <span>Day 1 · {shortDate(start, now)}</span>
        {open ? (
          <>
            {days.length > 1 && <span>Day {days.length} · today</span>}
            {days.length < slots && <span>Day {slots}</span>}
          </>
        ) : (
          <span>Day {days.length} · healed</span>
        )}
      </div>
    </div>
  );
}
