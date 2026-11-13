import type { DayLog, Sore } from '@/types';
import { isAnsweredClean } from '@/utils/day-log';
import {
  dayKey,
  dayKeyIn,
  isTimeZone,
  parseDay,
  shiftDay
} from '@/utils/days';

/** A reading at or above this pain level makes today a gentle day. */
export const BAD_DAY_PAIN = 6;

export type Mood = 'proud' | 'gentle' | 'neutral';

export type WeekDot = {
  day: string;
  initial: string;
  /** Both trigger questions answered: the day was logged. */
  logged: boolean;
  /** Logged with no triggers: the day counts toward the streak. */
  won: boolean;
  isToday: boolean;
};

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
  while (isAnsweredClean(byDay.get(cursor))) {
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
    const log = byDay.get(day);
    return {
      day,
      initial: weekday.charAt(0),
      logged: isAnswered(log),
      won: isAnsweredClean(log),
      isToday: day === today
    };
  });
};

/**
 * The longest run of consecutive trigger-free days on record, up to today.
 * Never less than the current streak, so "Best" can always sit beside it.
 */
export const bestTriggerFreeStreak = (
  logs: DayLog[],
  today: string
): number => {
  const clean = new Set(
    logs.filter((l) => l.day <= today && isAnsweredClean(l)).map((l) => l.day)
  );
  let best = 0;
  for (const day of Array.from(clean)) {
    // Count only from the first day of each run.
    if (clean.has(shiftDay(day, -1))) continue;
    let run = 0;
    let cursor = day;
    while (clean.has(cursor)) {
      run += 1;
      cursor = shiftDay(cursor, 1);
    }
    best = Math.max(best, run);
  }
  return Math.max(best, triggerFreeStreak(logs, today));
};

export type WeekStats = {
  /** Days of the last seven with both trigger questions answered. */
  logged: number;
  /** Logged days of the last seven that had a trigger. */
  triggerDays: number;
  /** Mean hours slept over the days that recorded it, or null. */
  sleepHours: number | null;
};

/** The figures for Today's "This week" tiles: the seven days ending today. */
export const weekStats = (logs: DayLog[], today: string): WeekStats => {
  const from = shiftDay(today, -6);
  const week = logs.filter((l) => l.day >= from && l.day <= today);
  const answered = week.filter(isAnswered);
  const slept = week
    .map((l) => l.sleep_hours)
    .filter((h): h is number => h !== null && h !== undefined)
    .map(Number);
  return {
    logged: answered.length,
    triggerDays: answered.filter((l) => !isAnsweredClean(l)).length,
    sleepHours: slept.length
      ? Math.round((slept.reduce((a, b) => a + b, 0) / slept.length) * 10) / 10
      : null
  };
};

/** The words beside the streak figure on Today's card. */
export const streakLabel = (n: number): string =>
  n === 1 ? 'Day strong' : 'Days strong';

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
  return isAnsweredClean(newest) ? 'proud' : 'neutral';
};
