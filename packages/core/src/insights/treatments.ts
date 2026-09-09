import type { DateKey } from '../dates';
import type { UserDataset } from '../types';
import type { TreatmentOutcome } from './types';
import {
  DEFAULT_MIN_SORES_PER_TREATMENT,
  type HealedSore,
  type InsightsTuning,
  compareNames,
  entryDateById,
  groupLogsBySore,
  isHealed,
  isTreatmentFactor,
  peakPain,
  soreDurationDays
} from './shared';
import { median1 } from './stats';

export const NO_TREATMENT_ID = 'none';
export const NO_TREATMENT_NAME = 'No treatment';

/** One application of a treatment factor on a calendar day, optionally aimed at one sore. */
interface Application {
  factor_id: string;
  date: DateKey;
  sore_id: string | null;
}

/**
 * Treatment outcomes over healed sores only. A sore is "treated with F" when a
 * non-archived treatment factor F was logged on a day inside [onset, healed]
 * either for this sore specifically or as a general (sore_id null) entry.
 */
export function computeTreatmentOutcomes(
  data: UserDataset,
  today: DateKey,
  options: InsightsTuning = {}
): TreatmentOutcome[] {
  const minSores = options.minSoresPerTreatment ?? DEFAULT_MIN_SORES_PER_TREATMENT;
  const treatmentNames = new Map<string, string>();
  for (const f of data.factors)
    if (isTreatmentFactor(f)) treatmentNames.set(f.id, f.name);

  const applications = collectApplications(data, treatmentNames);
  const logsBySore = groupLogsBySore(data.soreLogs);

  // Rule: a sore may sit in several treatment groups; with no treatment it sits in 'none'.
  const groups = new Map<string, HealedSore[]>();
  for (const sore of data.sores.filter(isHealed)) {
    const ids = treatmentsFor(sore, applications);
    if (ids.size === 0) addTo(groups, NO_TREATMENT_ID, sore);
    for (const id of ids) addTo(groups, id, sore);
  }

  const toOutcome = (
    factor_id: string,
    name: string,
    sores: HealedSore[]
  ): TreatmentOutcome => ({
    factor_id,
    name,
    sores: sores.length,
    median_days_to_heal: median1(sores.map((s) => soreDurationDays(s, today))) ?? 0,
    median_peak_pain: median1(
      sores.flatMap((s) => {
        const p = peakPain(logsBySore.get(s.id) ?? []);
        return p === null ? [] : [p];
      })
    )
  });

  const out: TreatmentOutcome[] = [];
  // Rule: the 'none' group comes first whenever it has at least one sore.
  const untreated = groups.get(NO_TREATMENT_ID);
  if (untreated && untreated.length > 0)
    out.push(toOutcome(NO_TREATMENT_ID, NO_TREATMENT_NAME, untreated));

  // Rule: treatments need at least minSoresPerTreatment sores; sorted by median days asc, then name.
  const treated: TreatmentOutcome[] = [];
  for (const [id, sores] of groups) {
    if (id === NO_TREATMENT_ID || sores.length < minSores) continue;
    treated.push(toOutcome(id, treatmentNames.get(id) ?? id, sores));
  }
  treated.sort((a, b) =>
    a.median_days_to_heal !== b.median_days_to_heal
      ? a.median_days_to_heal - b.median_days_to_heal
      : compareNames(a.name, b.name)
  );

  return [...out, ...treated];
}

/** Every entry_factor for a treatment factor, placed on its daily entry's date. */
function collectApplications(
  data: UserDataset,
  treatmentNames: Map<string, string>
): Application[] {
  const entryDate = entryDateById(data.dailyEntries);
  const out: Application[] = [];
  for (const ef of data.entryFactors) {
    if (!treatmentNames.has(ef.factor_id)) continue;
    const date = entryDate.get(ef.daily_entry_id);
    if (date === undefined) continue;
    out.push({ factor_id: ef.factor_id, date, sore_id: ef.sore_id });
  }
  return out;
}

/** Rule: an application counts for a sore when dated inside [onset, healed] and aimed at it or at nobody. */
function treatmentsFor(
  sore: HealedSore,
  applications: readonly Application[]
): Set<string> {
  const ids = new Set<string>();
  for (const a of applications) {
    if (a.sore_id !== null && a.sore_id !== sore.id) continue;
    if (a.date < sore.onset_date || a.date > sore.healed_date) continue;
    ids.add(a.factor_id);
  }
  return ids;
}

function addTo(groups: Map<string, HealedSore[]>, key: string, sore: HealedSore): void {
  const arr = groups.get(key);
  if (arr) arr.push(sore);
  else groups.set(key, [sore]);
}
