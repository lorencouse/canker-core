/**
 * Date keys are 'YYYY-MM-DD' strings. All domain dates (onset, healed, log,
 * entry) are calendar dates in the user's timezone, never instants, so the
 * whole app passes them around as keys and only converts at the edges.
 */
export type DateKey = string & { readonly __brand?: 'DateKey' };

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: unknown): value is DateKey {
  return typeof value === 'string' && KEY_RE.test(value);
}

/** Today's calendar date in the given IANA timezone. */
export function todayKey(timeZone: string, now: Date = new Date()): DateKey {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  } catch {
    return toDateKey(now);
  }
}

/** Local calendar date of a Date object. */
export function toDateKey(d: Date): DateKey {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a key to a UTC-midnight Date. Use only for arithmetic and formatting. */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromDateKey(key);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** b - a in whole days. Positive when b is after a. */
export function daysBetween(a: DateKey, b: DateKey): number {
  return Math.round((fromDateKey(b).getTime() - fromDateKey(a).getTime()) / 86_400_000);
}

/** Inclusive range of keys from `start` to `end`. Empty if end < start. */
export function eachDay(start: DateKey, end: DateKey): DateKey[] {
  const out: DateKey[] = [];
  const n = daysBetween(start, end);
  for (let i = 0; i <= n; i++) out.push(addDays(start, i));
  return out;
}

export function compareDateKeys(a: DateKey, b: DateKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function minDateKey(keys: readonly DateKey[]): DateKey | undefined {
  return keys.length ? keys.reduce((m, k) => (k < m ? k : m)) : undefined;
}

export function maxDateKey(keys: readonly DateKey[]): DateKey | undefined {
  return keys.length ? keys.reduce((m, k) => (k > m ? k : m)) : undefined;
}

/** "Sep 9" style short label, formatted in UTC so keys never shift a day. */
export function formatShort(key: DateKey, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(fromDateKey(key));
}

/** "Tue, Sep 9" style label. */
export function formatWeekday(key: DateKey, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(fromDateKey(key));
}

/** "Sep 9, 2026" style label. */
export function formatLong(key: DateKey, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(fromDateKey(key));
}
