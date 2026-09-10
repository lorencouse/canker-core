import type { Sore } from '@/types';
import { LONG_SORE_DAYS } from '@/utils/insights';
import { dayKey, dayNumberOf, latestReading } from '@/utils/readings';

/**
 * A sore's course: the day-by-day shape of it, and the one sentence that
 * says whether it is healing.
 *
 * The product exists to answer a single question, and until now the answer
 * was spread across a chart, a table and two sliders. Everything here is
 * derived from readings that already exist — no new columns, no new writes.
 *
 * The axis is the local calendar day, matching the "one reading per day"
 * rule in readings.ts. A sore marked at 23:00 and updated at 09:00 the next
 * morning has two readings on two days, and the strip has to show two cells.
 */

const DAY_MS = 86_400_000;

/** Midnight local, so day arithmetic ignores the time a reading was taken. */
const localMidnight = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Whole calendar days between two instants. Rounded, so DST cannot shift it. */
const daysBetween = (from: Date, to: Date) =>
  Math.round((localMidnight(to).getTime() - localMidnight(from).getTime()) / DAY_MS);

/** One day of a sore's life. `pain` is null on a day with no reading. */
export type CourseDay = {
  /** Local YYYY-MM-DD. */
  day: string;
  /** 1 on the day the sore was marked. */
  n: number;
  size: number | null;
  pain: number | null;
  /** The last day of a healed sore's course. */
  isHealedDay: boolean;
};

/**
 * Every day from the day a sore was marked to today — or to the day it
 * healed. Days with no reading are included with null values: a gap in the
 * record is information, and hiding it would make a patchy course look as
 * complete as a diligent one.
 */
export function courseOf(sore: Sore, now: Date = new Date()): CourseDay[] {
  const start = new Date(sore.created_at);
  const end = sore.healed_at ? new Date(sore.healed_at) : now;
  const span = Math.max(0, daysBetween(start, end));

  const byDay = new Map<string, { size: number; pain: number }>();
  for (const r of sore.readings) {
    // A later reading on the same day corrects an earlier one, matching
    // withReading's same-day behaviour.
    byDay.set(dayKey(new Date(r.recorded_at)), { size: r.size, pain: r.pain });
  }

  const days: CourseDay[] = [];
  for (let i = 0; i <= span; i++) {
    const date = new Date(localMidnight(start).getTime() + i * DAY_MS);
    const key = dayKey(date);
    const reading = byDay.get(key);
    days.push({
      day: key,
      n: i + 1,
      size: reading?.size ?? null,
      pain: reading?.pain ?? null,
      isHealedDay: Boolean(sore.healed_at) && i === span
    });
  }
  return days;
}

export type Direction = 'down' | 'up' | 'same';

export type Trend = {
  size: Direction;
  pain: Direction;
  /** How to name the reading being compared against, in prose. */
  against: 'yesterday' | 'last time';
} | null;

/**
 * The latest reading against the one before it, which is the comparison a
 * person actually makes. Null when there is nothing to compare — a sore on
 * its first reading is neither improving nor worsening, and saying either
 * would be a guess.
 */
export function trendOf(sore: Sore): Trend {
  const { readings } = sore;
  if (readings.length < 2) return null;
  const last = readings[readings.length - 1];
  const prev = readings[readings.length - 2];
  const direction = (from: number, to: number): Direction =>
    to < from ? 'down' : to > from ? 'up' : 'same';

  return {
    size: direction(prev.size, last.size),
    pain: direction(prev.pain, last.pain),
    against:
      daysBetween(new Date(prev.recorded_at), new Date(last.recorded_at)) === 1
        ? 'yesterday'
        : 'last time'
  };
}

/** Whether a reading was taken on `now`'s calendar day. */
const loggedToday = (sore: Sore, now: Date) => {
  const last = latestReading(sore);
  return last !== null && dayKey(new Date(last.recorded_at)) === dayKey(now);
};

/**
 * How a single sore is going, as a sentence. Deliberately plain: "narrower"
 * and "hurting less" are what a person would say, and neither claims a cause.
 */
export function courseSentence(sore: Sore, now: Date = new Date()): string {
  const day = dayNumberOf(sore, now);

  if (sore.healed_at) {
    return `Healed after ${day} day${day === 1 ? '' : 's'}.`;
  }
  if (!loggedToday(sore, now)) {
    return `Day ${day}. Nothing logged yet today.`;
  }

  const trend = trendOf(sore);
  if (!trend) return `Day ${day}. First reading logged.`;

  const size = { down: 'narrower', up: 'wider', same: null }[trend.size];
  const pain = { down: 'hurting less', up: 'hurting more', same: null }[trend.pain];

  if (!size && !pain) return `Day ${day}. No change since ${trend.against}.`;
  if (size && pain) return `Day ${day}. ${cap(size)} than ${trend.against}, and ${pain}.`;
  if (size) return `Day ${day}. ${cap(size)} than ${trend.against}, hurting the same.`;
  return `Day ${day}. ${cap(pain!)} than ${trend.against}, the same width.`;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export type Answer = {
  /** The sentence that answers "is it healing?". */
  headline: string;
  /** A second line, when there is something worth adding. Never filler. */
  note?: string;
};

/**
 * The answer line at the top of the check-in screen.
 *
 * One computed sentence rather than a row of figures, because the question
 * people arrive with is a question, not a dashboard.
 */
export function answerLine(sores: Sore[], now: Date = new Date()): Answer {
  if (sores.length === 0) {
    return {
      headline: 'Nothing logged yet.',
      note: 'Mark the first sore on the map and its course starts here.'
    };
  }

  const open = sores.filter((s) => !s.healed_at);

  if (open.length === 0) {
    const lastHealed = sores
      .map((s) => new Date(s.healed_at!).getTime())
      .sort((a, b) => b - a)[0];
    const clear = daysBetween(new Date(lastHealed), now);
    return {
      headline: 'Nothing open right now.',
      note:
        clear <= 0
          ? 'Healed today.'
          : `${clear} day${clear === 1 ? '' : 's'} clear.`
    };
  }

  // Longest-running first: it is the one that decides how the week is going,
  // and the one that might need a dentist.
  const [longest] = [...open].sort(
    (a, b) => dayNumberOf(b, now) - dayNumberOf(a, now)
  );
  const stubborn = dayNumberOf(longest, now) > LONG_SORE_DAYS;

  if (open.length === 1) {
    return {
      headline: courseSentence(longest, now),
      note: stubborn
        ? 'Over two weeks. Worth having a dentist look at it.'
        : undefined
    };
  }

  return {
    headline: `${open.length} sores open.`,
    // "on the" rather than "the <zone> one", which reads fine for the tongue
    // and not at all for the roof of mouth. Every zone name is a place, so
    // the preposition that suits a place suits all of them.
    note: `Longest is on the ${longest.zone.toLowerCase()} — ${lower(courseSentence(longest, now))}`
  };
}

/** "Day 9. Wider than yesterday." reads as a clause after an em dash. */
const lower = (s: string) => s[0].toLowerCase() + s.slice(1);
