import type { Sore } from '@/types';

/**
 * Reading arithmetic for a sore.
 *
 * A sore carries three parallel series — dates, size, pain — with one entry
 * per reading. The rule for a new value is "one reading per day": a change
 * made on the same local day as the last reading corrects that reading, and
 * a change on a later day appends a new one. Without the day boundary every
 * slider nudge would become a reading; without the append the history would
 * never grow past its first entry.
 */

/** Last entry of a reading series, which is the current value. */
export const latest = (series: number[] | null | undefined): number | null =>
  series && series.length ? series[series.length - 1] : null;

/** Local YYYY-MM-DD, so an evening reading stays on the day it was taken. */
export const dayKey = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const isSameLocalDay = (iso: string, when: Date): boolean =>
  dayKey(new Date(iso)) === dayKey(when);

/** Whether the sore already has a reading taken today. */
export const hasReadingOn = (sore: Sore, when: Date): boolean => {
  const last = sore.dates?.[sore.dates.length - 1];
  return last !== undefined && isSameLocalDay(last, when);
};

/**
 * The sore with a size and/or pain value recorded at `when`. Either value may
 * be omitted, in which case it carries forward from the previous reading — a
 * pain change alone still needs a size for the same row.
 */
export function withReading(
  sore: Sore,
  values: { size?: number; pain?: number },
  when: Date = new Date()
): Sore {
  const dates = sore.dates ?? [];
  const size = sore.size ?? [];
  const pain = sore.pain ?? [];

  const nextSize = values.size ?? latest(size) ?? 3;
  const nextPain = values.pain ?? latest(pain) ?? 3;

  if (dates.length && isSameLocalDay(dates[dates.length - 1], when)) {
    return {
      ...sore,
      size: [...size.slice(0, -1), nextSize],
      pain: [...pain.slice(0, -1), nextPain]
    };
  }

  return {
    ...sore,
    dates: [...dates, when.toISOString()],
    size: [...size, nextSize],
    pain: [...pain, nextPain]
  };
}

/**
 * Whole days a sore has been (or was) open, counting the day it was first
 * marked as day 1, the way people count a sore. A healed sore's count stops
 * at the healed date instead of climbing forever.
 */
export function dayNumberOf(sore: Sore, now: Date = new Date()): number | null {
  const first = sore.dates?.[0];
  if (!first) return null;
  const end = sore.healed ? new Date(sore.healed) : now;
  return Math.max(
    1,
    Math.floor((end.getTime() - new Date(first).getTime()) / 86_400_000) + 1
  );
}
