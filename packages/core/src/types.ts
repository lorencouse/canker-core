import type { DateKey } from './dates';
import type { FactorKind } from './factors';
import type { SoreSurface } from './surfaces';

/**
 * Domain types. Field names match the Postgres columns so rows from
 * `@canker/db` are assignable without a mapping layer.
 */

export type PlanTier = 'free' | 'pro';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  /** 'HH:MM' or 'HH:MM:SS' local time, or null for no reminder. */
  reminder_at: string | null;
  reminder_enabled: boolean;
  plan: PlanTier;
  onboarded_at: string | null;
}

export interface Sore {
  id: string;
  user_id: string;
  surface: SoreSurface;
  /** 0..1 within the surface. */
  x: number;
  /** 0..1 within the surface. */
  y: number;
  onset_date: DateKey;
  healed_date: DateKey | null;
  notes: string | null;
}

export interface SoreLog {
  id: string;
  sore_id: string;
  user_id: string;
  log_date: DateKey;
  size_mm: number;
  pain: number;
  notes: string | null;
  logged_late: boolean;
}

export interface DailyEntry {
  id: string;
  user_id: string;
  entry_date: DateKey;
  /** 0..4 */
  stress: number | null;
  /** 0..4 */
  sleep_quality: number | null;
  /** 0..10 */
  overall_pain: number | null;
  notes: string | null;
  logged_late: boolean;
}

export interface Factor {
  id: string;
  /** null for presets. */
  user_id: string | null;
  kind: FactorKind;
  name: string;
  is_preset: boolean;
  archived_at: string | null;
}

export interface EntryFactor {
  id: string;
  daily_entry_id: string;
  factor_id: string;
  user_id: string;
  /** Set when a treatment was applied to one specific sore. */
  sore_id: string | null;
  detail: string | null;
}

/** Everything the insights engine and most screens need, fetched once. */
export interface UserDataset {
  sores: Sore[];
  soreLogs: SoreLog[];
  dailyEntries: DailyEntry[];
  factors: Factor[];
  entryFactors: EntryFactor[];
}

/** A sore joined with its logs, in date order. Convenience for screens. */
export interface SoreWithLogs extends Sore {
  logs: SoreLog[];
}

export function joinSoreLogs(sores: Sore[], logs: SoreLog[]): SoreWithLogs[] {
  const byId = new Map<string, SoreLog[]>();
  for (const l of logs) {
    const arr = byId.get(l.sore_id);
    if (arr) arr.push(l);
    else byId.set(l.sore_id, [l]);
  }
  return sores.map((s) => ({
    ...s,
    logs: (byId.get(s.id) ?? [])
      .slice()
      .sort((a, b) => (a.log_date < b.log_date ? -1 : 1))
  }));
}

export function isActiveSore(sore: Pick<Sore, 'healed_date'>): boolean {
  return sore.healed_date === null;
}

/** Latest log for a sore, or undefined. */
export function latestLog(logs: readonly SoreLog[]): SoreLog | undefined {
  let best: SoreLog | undefined;
  for (const l of logs) if (!best || l.log_date > best.log_date) best = l;
  return best;
}
