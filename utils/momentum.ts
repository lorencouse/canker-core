import type { DayLog, Sore } from '@/types';
import { dayKey, isSameLocalDay } from '@/utils/readings';

/** A reading at or above this pain level makes today a gentle day. */
export const BAD_DAY_PAIN = 6;

export type Mood = 'proud' | 'gentle' | 'neutral';

export type WeekDot = { day: string; initial: string; won: boolean };

/** Parse a local YYYY-MM-DD at noon, which stays clear of DST edges. */
const parseDay = (day: string): Date => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

/** The local day `offset` calendar days from `day`, via Date arithmetic rather than milliseconds. */
const shiftDay = (day: string, offset: number): string => {
  const date = parseDay(day);
  date.setDate(date.getDate() + offset);
  return dayKey(date);
};

const isTriggerFree = (log: DayLog | undefined): boolean =>
  log !== undefined && log.triggers.length === 0;

/**
 * Consecutive local days logged with no triggers. An unlogged today does not
 * break the run; it just starts counting from yesterday.
 */
export const triggerFreeStreak = (logs: DayLog[], today: string): number => {
  const byDay = new Map(logs.map((log) => [log.day, log]));
  let cursor = byDay.has(today) ? today : shiftDay(today, -1);
  let count = 0;
  while (isTriggerFree(byDay.get(cursor))) {
    count += 1;
    cursor = shiftDay(cursor, -1);
  }
  return count;
};

export const isBadDay = (sores: Sore[], now: Date): boolean =>
  sores.some(
    (sore) =>
      isSameLocalDay(sore.created_at, now) ||
      sore.readings.some(
        (reading) =>
          isSameLocalDay(reading.recorded_at, now) &&
          reading.pain >= BAD_DAY_PAIN
      )
  );

export const todayMood = (sores: Sore[], logs: DayLog[], now: Date): Mood => {
  if (isBadDay(sores, now)) return 'gentle';
  return triggerFreeStreak(logs, dayKey(now)) >= 1 ? 'proud' : 'neutral';
};

export const weekDots = (logs: DayLog[], today: string): WeekDot[] => {
  const byDay = new Map(logs.map((log) => [log.day, log]));
  return Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(today, i - 6);
    const weekday = parseDay(day).toLocaleDateString(undefined, {
      weekday: 'short'
    });
    return {
      day,
      initial: weekday.charAt(0),
      won: isTriggerFree(byDay.get(day))
    };
  });
};

const WORDS = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten'
];

export const streakHeadline = (n: number): string => {
  const figure = n >= 1 && n <= 10 ? WORDS[n] : String(n);
  return `${figure} ${n === 1 ? 'day' : 'days'} strong.`;
};

/** The words beside the streak figure on Today's card. */
export const streakCardLabel = (n: number): string =>
  n === 1 ? 'trigger-free day' : 'trigger-free days';

/**
 * The saved logs after a Save. The day's log joins them only when Save
 * actually wrote it: adding an untouched log would count a day nobody
 * logged towards the streak.
 */
export const withSavedLog = (
  logs: DayLog[],
  log: DayLog,
  written: boolean
): DayLog[] =>
  written ? [...logs.filter((l) => l.day !== log.day), log] : logs;

const utcKey = (instant: number): string =>
  new Date(instant).toISOString().slice(0, 10);

/**
 * Which mood the block will probably show, from a clock that is not the
 * device's. Only the server can run this before hydration, and it has the
 * wrong "today" by up to a day either way, so each test is widened to every
 * day the device could be on (UTC-12 to UTC+14). It sizes the placeholder
 * and nothing else; the real mood still comes from `todayMood` on the
 * device.
 */
export const expectedMood = (
  sores: Sore[],
  logs: DayLog[],
  serverNow: Date
): Mood => {
  const t = serverNow.getTime();
  const HOUR = 3_600_000;
  const near = (iso: string) =>
    Math.abs(new Date(iso).getTime() - t) <= 25 * HOUR;
  const bad = sores.some(
    (sore) =>
      near(sore.created_at) ||
      sore.readings.some(
        (reading) => near(reading.recorded_at) && reading.pain >= BAD_DAY_PAIN
      )
  );
  if (bad) return 'gentle';
  // A streak needs today or yesterday logged, so look back one more day.
  const earliest = utcKey(t - 12 * HOUR - 24 * HOUR);
  const latest = utcKey(t + 14 * HOUR);
  const newest = logs
    .filter((l) => l.day >= earliest && l.day <= latest)
    .reduce<DayLog | undefined>(
      (best, l) => (best === undefined || l.day > best.day ? l : best),
      undefined
    );
  return isTriggerFree(newest) ? 'proud' : 'neutral';
};
