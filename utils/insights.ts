import type { DayLog, Sore } from '@/types';
import { dayKey, dayNumberOf } from '@/utils/readings';

/**
 * Summary arithmetic for the History screen.
 *
 * Everything here is descriptive — counts and medians over what was logged.
 * None of it is a diagnosis, and the copy that presents it says so. The
 * trigger tally in particular is a correlation over a handful of days and is
 * framed as "worth noticing", never "the cause".
 */

const DAY_MS = 86_400_000;

/** Sores that have lasted this long deserve a professional look. */
export const LONG_SORE_DAYS = 14;

export const isLongRunning = (sore: Sore, now: Date = new Date()) =>
  !sore.healed_at && dayNumberOf(sore, now) > LONG_SORE_DAYS;

const median = (values: number[]): number | null => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Median days from first mark to healed, over healed sores. */
export const medianDaysToHeal = (sores: Sore[]): number | null =>
  median(sores.filter((s) => s.healed_at).map((s) => dayNumberOf(s)));

/** Highest pain reading recorded on or after `since`. */
export function worstPainSince(sores: Sore[], since: Date): number | null {
  let worst: number | null = null;
  for (const s of sores)
    for (const r of s.readings)
      if (new Date(r.recorded_at) >= since && (worst === null || r.pain > worst)) worst = r.pain;
  return worst;
}

/** The zone that has had the most sores, with its count. */
export function mostCommonZone(sores: Sore[]): { zone: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const s of sores) counts.set(s.zone, (counts.get(s.zone) ?? 0) + 1);
  let best: { zone: string; count: number } | null = null;
  counts.forEach((count, zone) => {
    if (!best || count > best.count) best = { zone, count };
  });
  return best;
}

/** Sores first marked on or after `since`. */
export const soresStartedSince = (sores: Sore[], since: Date) =>
  sores.filter((s) => new Date(s.created_at) >= since).length;

export type Tally = { label: string; count: number };

/**
 * How often each trigger was logged in the `window` days leading up to (and
 * including) the day a sore was first marked. A trigger that keeps showing
 * up in that window is the one to look at.
 */
export function triggersBeforeSores(
  sores: Sore[],
  logs: DayLog[],
  window = 3
): { tally: Tally[]; soresWithLogs: number } {
  const byDay = new Map(logs.map((l) => [l.day, l]));
  const counts = new Map<string, number>();
  let soresWithLogs = 0;

  for (const s of sores) {
    const start = new Date(s.created_at);
    const seen = new Set<string>();
    let any = false;
    for (let i = 0; i < window; i++) {
      const log = byDay.get(dayKey(new Date(start.getTime() - i * DAY_MS)));
      if (!log) continue;
      any = true;
      for (const t of log.triggers) seen.add(t);
    }
    if (any) soresWithLogs++;
    seen.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
  }

  return { tally: sortTally(counts), soresWithLogs };
}

/** Days each treatment was logged, over all logs. */
export const treatmentDays = (logs: DayLog[]): Tally[] => {
  const counts = new Map<string, number>();
  for (const l of logs) for (const t of l.treatments) counts.set(t, (counts.get(t) ?? 0) + 1);
  return sortTally(counts);
};

const sortTally = (counts: Map<string, number>): Tally[] =>
  Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  );
