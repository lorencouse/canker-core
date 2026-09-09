import type { DateKey } from '../dates';
import { addDays, compareDateKeys, eachDay } from '../dates';
import { DERIVED_FACTORS, type FactorKind } from '../factors';
import type { UserDataset } from '../types';
import type { TriggerLift } from './types';
import {
  DEFAULT_MIN_FACTOR_HITS,
  DEFAULT_MIN_ONSETS_FOR_TRIGGERS,
  DEFAULT_TRIGGER_WINDOW,
  type InsightsTuning,
  compareNames,
  entryDateById,
  isTriggerFactor
} from './shared';
import { round2 } from './stats';

/** Result of the trigger analysis; mirrors the three trigger fields on Insights. */
export interface TriggerAnalysis {
  triggers: TriggerLift[];
  triggers_ready: boolean;
  onsets_until_triggers: number;
}

/** A factor (real or derived) with the set of calendar days it was present on. */
interface Candidate {
  factor_id: string;
  name: string;
  kind: FactorKind;
  derived: boolean;
  days: Set<DateKey>;
}

/**
 * Trigger lift: how much more often a factor is logged in the days before an
 * onset than on ordinary days. Onsets after `today` are ignored.
 */
export function computeTriggerLift(
  data: UserDataset,
  today: DateKey,
  options: InsightsTuning = {}
): TriggerAnalysis {
  const { from, to } = normalizeWindow(options.triggerWindow);
  const minOnsets = options.minOnsetsForTriggers ?? DEFAULT_MIN_ONSETS_FOR_TRIGGERS;
  const minHits = options.minFactorHits ?? DEFAULT_MIN_FACTOR_HITS;

  // Rule: one onset per sore; sores sharing an onset date each count.
  const onsets = data.sores
    .map((s) => s.onset_date)
    .filter((d) => d <= today)
    .sort(compareDateKeys);

  // Rule: nothing is shown until minOnsetsForTriggers is reached.
  if (onsets.length < minOnsets) {
    return {
      triggers: [],
      triggers_ready: false,
      onsets_until_triggers: minOnsets - onsets.length
    };
  }

  // Rule: the window for an onset is the days [onset - to, onset - from].
  const windows = onsets.map((onset) =>
    eachDay(addDays(onset, -to), addDays(onset, -from))
  );
  const windowDays = new Set<DateKey>();
  for (const w of windows) for (const d of w) windowDays.add(d);
  const onsetDays = new Set<DateKey>(onsets);
  const isBaselineDay = (d: DateKey): boolean => !windowDays.has(d) && !onsetDays.has(d);

  // Rule: baseline denominator = days with a daily entry outside every window and off every onset day.
  const entryDays = new Set<DateKey>(data.dailyEntries.map((e) => e.entry_date));
  let baselineDenominator = 0;
  for (const d of entryDays) if (isBaselineDay(d)) baselineDenominator++;

  const triggers: TriggerLift[] = [];
  for (const cand of collectCandidates(data)) {
    const window_hits = windows.filter((w) => w.some((d) => cand.days.has(d))).length;
    if (window_hits < minHits) continue;

    let baselineHits = 0;
    for (const d of cand.days) if (isBaselineDay(d)) baselineHits++;

    const window_rate = window_hits / onsets.length;
    const baseline_rate =
      baselineDenominator === 0 ? 0 : baselineHits / baselineDenominator;
    // Rule: lift = window_rate / baseline_rate; Infinity when baseline is 0 and window_rate > 0.
    const lift =
      baseline_rate === 0
        ? window_rate > 0
          ? Infinity
          : 0
        : window_rate / baseline_rate;

    triggers.push({
      factor_id: cand.factor_id,
      name: cand.name,
      kind: cand.kind,
      derived: cand.derived,
      window_hits,
      onsets: onsets.length,
      baseline_rate: round2(baseline_rate),
      window_rate: round2(window_rate),
      lift: round2(lift)
    });
  }

  triggers.sort(byLiftDesc);
  return { triggers, triggers_ready: true, onsets_until_triggers: 0 };
}

/** Window bounds in days before onset; swapped if given backwards, never negative. */
function normalizeWindow(window: InsightsTuning['triggerWindow']): {
  from: number;
  to: number;
} {
  const from = Math.max(0, window?.from ?? DEFAULT_TRIGGER_WINDOW.from);
  const to = Math.max(0, window?.to ?? DEFAULT_TRIGGER_WINDOW.to);
  return from <= to ? { from, to } : { from: to, to: from };
}

/**
 * Candidates: every non-archived TRIGGER_KINDS factor that appears in at least
 * one general (sore_id null) entry_factor, plus the two derived pseudo-factors.
 */
function collectCandidates(data: UserDataset): Candidate[] {
  const entryDate = entryDateById(data.dailyEntries);
  const byId = new Map<string, Candidate>();
  for (const f of data.factors) {
    if (!isTriggerFactor(f)) continue;
    byId.set(f.id, {
      factor_id: f.id,
      name: f.name,
      kind: f.kind,
      derived: false,
      days: new Set()
    });
  }

  for (const ef of data.entryFactors) {
    // Rule: entry_factors tied to a sore are treatments applied to it, not exposures.
    if (ef.sore_id !== null) continue;
    const cand = byId.get(ef.factor_id);
    const date = entryDate.get(ef.daily_entry_id);
    if (cand && date !== undefined) cand.days.add(date);
  }

  const poorSleep = derivedCandidate(DERIVED_FACTORS.poorSleep);
  const highStress = derivedCandidate(DERIVED_FACTORS.highStress);
  for (const e of data.dailyEntries) {
    // Rule: poor sleep when sleep_quality <= threshold; high stress when stress >= threshold.
    if (
      e.sleep_quality !== null &&
      e.sleep_quality <= DERIVED_FACTORS.poorSleep.threshold
    ) {
      poorSleep.days.add(e.entry_date);
    }
    if (e.stress !== null && e.stress >= DERIVED_FACTORS.highStress.threshold) {
      highStress.days.add(e.entry_date);
    }
  }

  const real = [...byId.values()].filter((c) => c.days.size > 0);
  return [...real, poorSleep, highStress];
}

function derivedCandidate(def: {
  id: string;
  name: string;
  kind: FactorKind;
}): Candidate {
  return {
    factor_id: def.id,
    name: def.name,
    kind: def.kind,
    derived: true,
    days: new Set()
  };
}

/** Sort: lift desc (Infinity first), then window_hits desc, then name. */
function byLiftDesc(a: TriggerLift, b: TriggerLift): number {
  if (a.lift !== b.lift) return a.lift > b.lift ? -1 : 1;
  if (a.window_hits !== b.window_hits) return b.window_hits - a.window_hits;
  return compareNames(a.name, b.name);
}
