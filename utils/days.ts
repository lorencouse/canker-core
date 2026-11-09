/**
 * Calendar-day arithmetic, kept in one place because it is easy to get subtly
 * wrong: every step here moves the calendar rather than adding 24-hour
 * periods, which would repeat or skip a date across a daylight-saving change.
 */

/** Local YYYY-MM-DD, so an evening reading stays on the day it was taken. */
export const dayKey = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Midnight local, so day arithmetic ignores the time of day. */
export const localMidnight = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Local midnight `n` calendar days from `date`'s day (negative goes back). */
export const addDays = (date: Date, n: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

/** Whole local calendar days from `from`'s day to `to`'s day. Rounded, so DST cannot shift it. */
export const daysBetween = (from: Date, to: Date): number =>
  Math.round(
    (localMidnight(to).getTime() - localMidnight(from).getTime()) / 86_400_000
  );

/** Parse a local YYYY-MM-DD at noon, which stays clear of DST edges. */
export const parseDay = (day: string): Date => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

/** The local day `offset` calendar days from `day`. */
export const shiftDay = (day: string, offset: number): string => {
  const date = parseDay(day);
  date.setDate(date.getDate() + offset);
  return dayKey(date);
};

export const isSameLocalDay = (iso: string, when: Date): boolean =>
  dayKey(new Date(iso)) === dayKey(when);

/** The device's IANA zone, so the server can draw day lines where this does. */
export const localTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Whether `timeZone` is an IANA zone this runtime can compute days in. */
export function isTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== 'string' || !timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** YYYY-MM-DD of `iso` in `timeZone`, the server's twin of `dayKey`. */
export const dayKeyIn = (iso: string, timeZone: string): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(iso));
