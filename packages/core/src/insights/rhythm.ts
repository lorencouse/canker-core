import type { DateKey } from '../dates';
import { compareDateKeys, daysBetween } from '../dates';
import type { FlareUp, Rhythm } from './types';
import { mean1, median1 } from './stats';

/** Rhythm: flare-up start dates ascending, the gaps between consecutive starts, and their mean/median. */
export function computeRhythm(flareUps: readonly FlareUp[]): Rhythm {
  const flare_starts: DateKey[] = flareUps.map((f) => f.started_on).sort(compareDateKeys);
  const gaps_days: number[] = [];
  for (let i = 1; i < flare_starts.length; i++) {
    gaps_days.push(daysBetween(flare_starts[i - 1]!, flare_starts[i]!));
  }
  // Rule: mean/median are null until there are at least two flare-ups (one gap).
  return {
    flare_starts,
    gaps_days,
    mean_gap_days: mean1(gaps_days),
    median_gap_days: median1(gaps_days)
  };
}
