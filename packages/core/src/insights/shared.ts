import type { DateKey } from '../dates';
import { daysBetween } from '../dates';
import { TRIGGER_KINDS } from '../factors';
import type { DailyEntry, Factor, Sore, SoreLog } from '../types';
import type { InsightsOptions } from './types';
import { max } from './stats';

/** Everything in InsightsOptions except `today`, which the pure functions take separately. */
export type InsightsTuning = Omit<InsightsOptions, 'today'>;

export const DEFAULT_TRIGGER_WINDOW = { from: 1, to: 3 } as const;
export const DEFAULT_MIN_ONSETS_FOR_TRIGGERS = 5;
export const DEFAULT_MIN_FACTOR_HITS = 3;
export const DEFAULT_MIN_SORES_PER_TREATMENT = 3;

/** A sore whose healed_date is known to be set. */
export type HealedSore = Sore & { healed_date: DateKey };

export function isHealed(sore: Sore): sore is HealedSore {
  return sore.healed_date !== null;
}

/** Last active day of a sore: healed_date, or today while active. Never before onset. */
export function soreEnd(
  sore: Pick<Sore, 'onset_date' | 'healed_date'>,
  today: DateKey
): DateKey {
  const end = sore.healed_date ?? today;
  return end < sore.onset_date ? sore.onset_date : end;
}

/** Rule: duration = daysBetween(onset, healed ?? today) + 1, so a same-day heal is 1 day. */
export function soreDurationDays(
  sore: Pick<Sore, 'onset_date' | 'healed_date'>,
  today: DateKey
): number {
  return daysBetween(sore.onset_date, soreEnd(sore, today)) + 1;
}

/** Stable ordering for sores: onset ascending, then id. */
export function compareSores(a: Sore, b: Sore): number {
  if (a.onset_date !== b.onset_date) return a.onset_date < b.onset_date ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Plain string ordering that does not depend on the runtime locale. */
export function compareNames(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Group logs by sore id. */
export function groupLogsBySore(logs: readonly SoreLog[]): Map<string, SoreLog[]> {
  const out = new Map<string, SoreLog[]>();
  for (const log of logs) {
    const arr = out.get(log.sore_id);
    if (arr) arr.push(log);
    else out.set(log.sore_id, [log]);
  }
  return out;
}

/** Highest pain across the given logs, or null when there are none. */
export function peakPain(logs: readonly SoreLog[]): number | null {
  return max(logs.map((l) => l.pain));
}

/** daily_entry id -> entry_date, so entry_factors can be placed on a calendar day. */
export function entryDateById(entries: readonly DailyEntry[]): Map<string, DateKey> {
  const out = new Map<string, DateKey>();
  for (const e of entries) out.set(e.id, e.entry_date);
  return out;
}

/** A factor is a trigger candidate when it is not archived and its kind is in TRIGGER_KINDS. */
export function isTriggerFactor(factor: Factor): boolean {
  return factor.archived_at === null && TRIGGER_KINDS.includes(factor.kind);
}

/** A factor is a treatment when it is not archived and its kind is 'treatment'. */
export function isTreatmentFactor(factor: Factor): boolean {
  return factor.archived_at === null && factor.kind === 'treatment';
}
