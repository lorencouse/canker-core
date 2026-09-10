import { v4 as uuidv4 } from 'uuid';

import type { Reading, Sore } from '@/types';

/**
 * Reading arithmetic for a sore.
 *
 * The rule for a new value is "one reading per day": a change made on the
 * same local day as the last reading corrects that reading, and a change on
 * a later day appends a new one. Without the day boundary every slider nudge
 * would become a reading; without the append the history would never grow
 * past its first entry.
 */

export const DEFAULT_SIZE = 3;
export const DEFAULT_PAIN = 3;

/** The most recent reading, which is the sore's current state. */
export const latestReading = (sore: Sore | null | undefined): Reading | null =>
  sore && sore.readings.length ? sore.readings[sore.readings.length - 1] : null;

export const currentSize = (sore: Sore | null | undefined): number =>
  latestReading(sore)?.size ?? DEFAULT_SIZE;

export const currentPain = (sore: Sore | null | undefined): number =>
  latestReading(sore)?.pain ?? DEFAULT_PAIN;

/** Local YYYY-MM-DD, so an evening reading stays on the day it was taken. */
export const dayKey = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const isSameLocalDay = (iso: string, when: Date): boolean =>
  dayKey(new Date(iso)) === dayKey(when);

/** Whether the sore already has a reading taken on `when`'s day. */
export const hasReadingOn = (sore: Sore, when: Date): boolean => {
  const last = latestReading(sore);
  return last !== null && isSameLocalDay(last.recorded_at, when);
};

/** A fresh first reading for a sore placed just now. */
export const newReading = (when: Date = new Date()): Reading => ({
  id: uuidv4(),
  recorded_at: when.toISOString(),
  size: DEFAULT_SIZE,
  pain: DEFAULT_PAIN,
  note: null
});

/**
 * The sore with size, pain and/or a note recorded at `when`. Whatever is
 * omitted carries forward from the previous reading — a pain change alone
 * still needs a size on the same row.
 */
export function withReading(
  sore: Sore,
  values: { size?: number; pain?: number; note?: string | null },
  when: Date = new Date()
): Sore {
  const last = latestReading(sore);

  if (last && isSameLocalDay(last.recorded_at, when)) {
    const corrected: Reading = {
      ...last,
      size: values.size ?? last.size,
      pain: values.pain ?? last.pain,
      note: values.note === undefined ? last.note : values.note
    };
    return { ...sore, readings: [...sore.readings.slice(0, -1), corrected] };
  }

  const appended: Reading = {
    id: uuidv4(),
    recorded_at: when.toISOString(),
    size: values.size ?? last?.size ?? DEFAULT_SIZE,
    pain: values.pain ?? last?.pain ?? DEFAULT_PAIN,
    // A note describes a day; it does not carry forward.
    note: values.note ?? null
  };
  return { ...sore, readings: [...sore.readings, appended] };
}

/**
 * Whole days a sore has been (or was) open, counting the day it was first
 * marked as day 1, the way people count a sore. A healed sore's count stops
 * at the healed date instead of climbing forever.
 *
 * Counted in local calendar days, not in 24-hour periods: a sore marked at
 * 23:00 and updated the next morning is on day 2, and it already has two
 * readings, since a reading belongs to the day it was taken. Rounding rather
 * than flooring keeps a 23- or 25-hour day from shifting the count.
 */
export function dayNumberOf(sore: Sore, now: Date = new Date()): number {
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const start = midnight(new Date(sore.created_at));
  const end = midnight(new Date(sore.healed_at ?? now));
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
}
