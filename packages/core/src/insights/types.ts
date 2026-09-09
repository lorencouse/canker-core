import type { DateKey } from '../dates';
import type { FactorKind } from '../factors';
import type { SoreSurface } from '../surfaces';

/**
 * Output contract of the insights engine. Every number that could be misread
 * as a diagnosis carries the sample size it was computed from, and the UI is
 * expected to show it.
 */

export interface InsightsOptions {
  /** Today's date key in the user's timezone. */
  today: DateKey;
  /** Days before onset in which a factor counts as "preceding". Default 1..3. */
  triggerWindow?: { from: number; to: number };
  /** Minimum onsets before trigger lift is shown at all. Default 5. */
  minOnsetsForTriggers?: number;
  /** Minimum onset windows a factor must appear in to be listed. Default 3. */
  minFactorHits?: number;
  /** Minimum healed sores in a treatment group before it is listed. Default 3. */
  minSoresPerTreatment?: number;
}

export interface FlareUp {
  started_on: DateKey;
  /** Equals `today` while active. */
  ended_on: DateKey;
  days: number;
  is_active: boolean;
  sore_ids: string[];
  peak_pain: number | null;
}

export interface SoreSummary {
  sore_id: string;
  surface: SoreSurface;
  onset_date: DateKey;
  healed_date: DateKey | null;
  /** Days from onset to healed (or to today while active). */
  duration_days: number;
  peak_pain: number | null;
  peak_size_mm: number | null;
  log_count: number;
  /** True when active for longer than LONG_SORE_DAYS. */
  is_long_running: boolean;
}

export interface Summary {
  total_sores: number;
  active_sores: number;
  healed_sores: number;
  /** Distinct days with at least one log or daily entry. */
  days_tracked: number;
  /** First and last dates with any data, or null when empty. */
  first_date: DateKey | null;
  last_date: DateKey | null;
  /** Over healed sores only. null until there is at least one. */
  mean_duration_days: number | null;
  median_duration_days: number | null;
  mean_peak_pain: number | null;
  /** Mean days from one flare-up start to the next. null until 2+ flare-ups. */
  mean_gap_days: number | null;
  /** Surface with the most sores, or null. */
  most_common_surface: SoreSurface | null;
  most_common_surface_count: number;
  /** Day number of the current flare-up (1-based), or null when none is active. */
  current_flare_day: number | null;
}

export interface TriggerLift {
  factor_id: string;
  name: string;
  kind: FactorKind;
  /** Whether this is a derived pseudo-factor (sleep, stress). */
  derived: boolean;
  /** Onsets whose preceding window contained this factor. */
  window_hits: number;
  /** Total onsets considered. */
  onsets: number;
  /** Share of non-window days on which the factor was logged. */
  baseline_rate: number;
  /** Share of onset windows in which the factor was logged. */
  window_rate: number;
  /** window_rate / baseline_rate. Infinity when baseline is 0 and window_rate > 0. */
  lift: number;
}

export interface TreatmentOutcome {
  /** 'none' for the untreated group. */
  factor_id: string;
  name: string;
  sores: number;
  median_days_to_heal: number;
  median_peak_pain: number | null;
}

export interface Rhythm {
  /** Start dates of every flare-up, ascending. */
  flare_starts: DateKey[];
  /** Days between consecutive flare-up starts. */
  gaps_days: number[];
  mean_gap_days: number | null;
  median_gap_days: number | null;
}

export type AlertKind = 'long_running_sore' | 'frequent_onsets' | 'no_log_today';

export interface Alert {
  kind: AlertKind;
  /** Short, human sentence. Never names a condition. */
  message: string;
  sore_id?: string;
}

export interface Insights {
  summary: Summary;
  sores: SoreSummary[];
  flare_ups: FlareUp[];
  /** Empty until minOnsetsForTriggers is reached. Sorted by lift desc. */
  triggers: TriggerLift[];
  /** Whether the trigger section has enough data to show anything. */
  triggers_ready: boolean;
  /** Onsets needed before triggers become ready. 0 once ready. */
  onsets_until_triggers: number;
  /** Untreated group first, then treatments sorted by median days asc. */
  treatments: TreatmentOutcome[];
  rhythm: Rhythm;
  alerts: Alert[];
}
