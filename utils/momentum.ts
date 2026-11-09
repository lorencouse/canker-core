import type { DayLog, Sore } from '@/types';
import { isAnsweredClean } from '@/utils/day-log';
import { dayKey } from '@/utils/readings';
import { dayKeyIn, isTimeZone } from '@/utils/sore-payload';

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

const isTriggerFree = isAnsweredClean;

/**
 * Whether a day has both trigger questions answered. A row can exist
 * without that (a morning check-in saves today's sleep and treatments), and
 * such a day is still open, not logged.
 */
export const isAnswered = (log: DayLog | undefined): boolean =>
  log !== undefined && log.food_answered && log.health_answered;

/**
 * Consecutive local days logged with no triggers. A today not yet answered
 * does not break the run; it just starts counting from yesterday.
 */
export const triggerFreeStreak = (logs: DayLog[], today: string): number => {
  const byDay = new Map(logs.map((log) => [log.day, log]));
  let cursor = isAnswered(byDay.get(today)) ? today : shiftDay(today, -1);
  let count = 0;
  while (isTriggerFree(byDay.get(cursor))) {
    count += 1;
    cursor = shiftDay(cursor, -1);
  }
  return count;
};

/** Whether `today` is a bad day, with `dayOf` giving each instant's local day. */
const isBadDayOn = (
  sores: Sore[],
  today: string,
  dayOf: (iso: string) => string
): boolean =>
  sores.some(
    (sore) =>
      dayOf(sore.created_at) === today ||
      sore.readings.some(
        (reading) =>
          dayOf(reading.recorded_at) === today && reading.pain >= BAD_DAY_PAIN
      )
  );

const deviceDay = (iso: string): string => dayKey(new Date(iso));

export const isBadDay = (sores: Sore[], now: Date): boolean =>
  isBadDayOn(sores, dayKey(now), deviceDay);

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

/** The saved logs after a Save, with this day's log replacing any earlier copy. */
export const withSavedLog = (logs: DayLog[], log: DayLog): DayLog[] => [
  ...logs.filter((l) => l.day !== log.day),
  log
];

const utcKey = (instant: number): string =>
  new Date(instant).toISOString().slice(0, 10);

/**
 * Which mood the block will probably show, from a clock that is not the
 * device's. Only the server can run this before hydration. Given the zone
 * the device last reported, it is the device's own answer; without one the
 * server has the wrong "today" by up to a day either way, so each test is
 * widened to every day the device could be on (UTC-12 to UTC+14). It sizes
 * the placeholder and nothing else; the real mood still comes from
 * `todayMood` on the device.
 */
export const expectedMood = (
  sores: Sore[],
  logs: DayLog[],
  serverNow: Date,
  timeZone?: string
): Mood => {
  if (isTimeZone(timeZone)) {
    const dayOf = (iso: string) => dayKeyIn(iso, timeZone);
    const today = dayOf(serverNow.toISOString());
    if (isBadDayOn(sores, today, dayOf)) return 'gentle';
    return triggerFreeStreak(logs, today) >= 1 ? 'proud' : 'neutral';
  }
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
  // Only an answered day can decide it, as in `triggerFreeStreak`.
  const newest = logs
    .filter((l) => l.day >= earliest && l.day <= latest && isAnswered(l))
    .reduce<
      DayLog | undefined
    >((best, l) => (best === undefined || l.day > best.day ? l : best), undefined);
  return isTriggerFree(newest) ? 'proud' : 'neutral';
};
