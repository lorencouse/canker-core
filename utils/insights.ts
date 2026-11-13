import type { DayLog, Sore } from '@/types';
import { effectiveTriggers } from '@/utils/day-log';
import { isAnswered } from '@/utils/momentum';
import { dayNumberOf } from '@/utils/readings';
import { addDays, dayKey } from '@/utils/days';

/**
 * Summary arithmetic for the History screen.
 *
 * Everything here is descriptive — counts and medians over what was logged.
 * None of it is a diagnosis, and the copy that presents it says so. The
 * trigger tally in particular is a correlation over a handful of days and is
 * framed as "worth noticing", never "the cause".
 */

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
      const log = byDay.get(dayKey(addDays(start, -i)));
      if (!log) continue;
      const triggers = effectiveTriggers(log);
      // A row with only treatments says nothing about triggers, but one that
      // carries a trigger (a stressed check-in, a short night from Health)
      // does, or a trigger could be counted for more sores than the total.
      if (isAnswered(log) || triggers.length > 0) any = true;
      for (const t of triggers) seen.add(t);
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

/** A trigger has to precede at least this many sores before it is a pattern. */
export const PATTERN_MIN_SORES = 2;

export type Finding =
  | { kind: 'pattern'; trigger: string; count: number; of: number }
  | { kind: 'none'; reason: 'no-logs' | 'no-repeat' };

/**
 * The one finding Insights leads with: the trigger logged before the most
 * sores, if it is a repeat (two sores at least) and came before half of the
 * sores that have logs. One sore is a coincidence, and "1 of 6" is noise
 * dressed as a headline. A tie goes to the trigger `triggersBeforeSores`
 * sorts first, so the card does not flip between visits.
 */
export function strongestPattern(sores: Sore[], logs: DayLog[], window = 3): Finding {
  const { tally, soresWithLogs } = triggersBeforeSores(sores, logs, window);
  if (soresWithLogs === 0) return { kind: 'none', reason: 'no-logs' };
  const top = tally[0];
  if (!top || top.count < PATTERN_MIN_SORES || top.count * 2 < soresWithLogs)
    return { kind: 'none', reason: 'no-repeat' };
  return { kind: 'pattern', trigger: top.label, count: top.count, of: soresWithLogs };
}

/** Sores that were open at any point on or after `since`. */
export const soresActiveSince = (sores: Sore[], since: Date) =>
  sores.filter((s) => !s.healed_at || new Date(s.healed_at) >= since);

/** Median days to heal over sores that healed on or after `since`. */
export const medianDaysToHealSince = (sores: Sore[], since: Date) =>
  medianDaysToHeal(sores.filter((s) => s.healed_at && new Date(s.healed_at) >= since));

export type SoreDay = {
  /** Local YYYY-MM-DD. */
  day: string;
  /** The largest sore measured that day, in mm. */
  size: number;
  /** The worst pain recorded that day. */
  pain: number;
  /** Every sore measured that day, largest first. */
  sores: { id: string; zone: string; size: number; pain: number }[];
};

/**
 * One entry per local day with a reading on or after `since`, oldest
 * first. A day's bar is its largest sore, coloured by its worst pain, and
 * the entry keeps every sore so the readout can name them all.
 */
export function soreDays(sores: Sore[], since: Date | null): SoreDay[] {
  const byDay = new Map<string, SoreDay>();
  const from = since ? dayKey(since) : null;
  for (const s of sores)
    for (const r of s.readings) {
      const day = dayKey(new Date(r.recorded_at));
      if (from && day < from) continue;
      const entry = byDay.get(day) ?? { day, size: 0, pain: 0, sores: [] };
      entry.sores.push({ id: s.id, zone: s.zone, size: r.size, pain: r.pain });
      entry.size = Math.max(entry.size, r.size);
      entry.pain = Math.max(entry.pain, r.pain);
      byDay.set(day, entry);
    }
  return Array.from(byDay.values())
    .map((d) => ({ ...d, sores: d.sores.sort((a, b) => b.size - a.size) }))
    .sort((a, b) => a.day.localeCompare(b.day));
}
