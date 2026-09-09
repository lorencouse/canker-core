import type { DateKey } from '../dates';
import { daysBetween, maxDateKey, minDateKey } from '../dates';
import { LONG_SORE_DAYS } from '../pain';
import { SORE_SURFACES, type SoreSurface } from '../surfaces';
import type { Sore, SoreLog, UserDataset } from '../types';
import type { FlareUp, SoreSummary, Summary } from './types';
import { computeRhythm } from './rhythm';
import { compareSores, groupLogsBySore, peakPain, soreDurationDays } from './shared';
import { max, mean1, median1 } from './stats';

/** One SoreSummary per sore, ordered by onset then id. */
export function summarizeSores(
  sores: readonly Sore[],
  soreLogs: readonly SoreLog[],
  today: DateKey
): SoreSummary[] {
  const logsBySore = groupLogsBySore(soreLogs);
  return [...sores].sort(compareSores).map((sore) => {
    const logs = logsBySore.get(sore.id) ?? [];
    const duration_days = soreDurationDays(sore, today);
    return {
      sore_id: sore.id,
      surface: sore.surface,
      onset_date: sore.onset_date,
      healed_date: sore.healed_date,
      duration_days,
      peak_pain: peakPain(logs),
      peak_size_mm: max(logs.map((l) => l.size_mm)),
      log_count: logs.length,
      // Rule: long-running means still active and open for more than LONG_SORE_DAYS.
      is_long_running: sore.healed_date === null && duration_days > LONG_SORE_DAYS
    };
  });
}

/** The dataset-wide Summary. Sample sizes are counted exactly; nothing is estimated. */
export function summarize(
  data: UserDataset,
  soreSummaries: readonly SoreSummary[],
  flareUps: readonly FlareUp[],
  today: DateKey
): Summary {
  const healed = soreSummaries.filter((s) => s.healed_date !== null);
  const healedDurations = healed.map((s) => s.duration_days);
  const peakPains = soreSummaries.flatMap((s) =>
    s.peak_pain === null ? [] : [s.peak_pain]
  );

  // Rule: days_tracked counts distinct dates carrying a sore log or a daily entry.
  const trackedDays = new Set<DateKey>();
  for (const l of data.soreLogs) trackedDays.add(l.log_date);
  for (const e of data.dailyEntries) trackedDays.add(e.entry_date);

  // Rule: first/last date span the tracked days plus every onset and healed date.
  const allDates: DateKey[] = [...trackedDays];
  for (const s of data.sores) {
    allDates.push(s.onset_date);
    if (s.healed_date !== null) allDates.push(s.healed_date);
  }

  const surface = mostCommonSurface(data.sores);
  const activeFlare = flareUps.find((f) => f.is_active);

  return {
    total_sores: soreSummaries.length,
    active_sores: soreSummaries.length - healed.length,
    healed_sores: healed.length,
    days_tracked: trackedDays.size,
    first_date: minDateKey(allDates) ?? null,
    last_date: maxDateKey(allDates) ?? null,
    mean_duration_days: mean1(healedDurations),
    median_duration_days: median1(healedDurations),
    mean_peak_pain: mean1(peakPains),
    mean_gap_days: computeRhythm(flareUps).mean_gap_days,
    most_common_surface: surface?.surface ?? null,
    most_common_surface_count: surface?.count ?? 0,
    // Rule: current_flare_day = today - active flare start + 1.
    current_flare_day: activeFlare ? daysBetween(activeFlare.started_on, today) + 1 : null
  };
}

/** Surface with the most sores; ties break by SORE_SURFACES display order. */
export function mostCommonSurface(
  sores: readonly Pick<Sore, 'surface'>[]
): { surface: SoreSurface; count: number } | null {
  if (sores.length === 0) return null;
  const counts = new Map<SoreSurface, number>();
  for (const s of sores) counts.set(s.surface, (counts.get(s.surface) ?? 0) + 1);
  let best: { surface: SoreSurface; count: number } | null = null;
  for (const surface of SORE_SURFACES) {
    const count = counts.get(surface) ?? 0;
    if (count > 0 && (best === null || count > best.count)) best = { surface, count };
  }
  return best;
}
