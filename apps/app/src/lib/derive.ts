import {
  addDays,
  daysBetween,
  joinSoreLogs,
  latestLog,
  type DateKey,
  type Factor,
  type SoreLog,
  type SoreWithLogs,
  type UserDataset
} from '@canker/core';

/** Small, screen-oriented derivations. Heavy analysis lives in @canker/core/insights. */

export function activeSores(data: UserDataset): SoreWithLogs[] {
  return joinSoreLogs(
    data.sores.filter((s) => s.healed_date === null),
    data.soreLogs
  ).sort((a, b) => (a.onset_date < b.onset_date ? -1 : 1));
}

/** Sores that existed on `date`, including the day one healed. */
export function soresOn(data: UserDataset, date: DateKey): SoreWithLogs[] {
  return joinSoreLogs(
    data.sores.filter(
      (s) => s.onset_date <= date && (s.healed_date === null || s.healed_date >= date)
    ),
    data.soreLogs
  );
}

/** Sores that existed on `date` and are still unhealed. */
export function activeSoresOn(data: UserDataset, date: DateKey): SoreWithLogs[] {
  return joinSoreLogs(
    data.sores.filter((s) => s.onset_date <= date && s.healed_date === null),
    data.soreLogs
  );
}

/** Whether a sore should read as healed when looking at `date`. */
export function healedBy(sore: { healed_date: DateKey | null }, date: DateKey): boolean {
  return sore.healed_date !== null && sore.healed_date <= date;
}

export function soreDay(sore: { onset_date: DateKey }, date: DateKey): number {
  return daysBetween(sore.onset_date, date) + 1;
}

export function logOn(logs: readonly SoreLog[], date: DateKey): SoreLog | undefined {
  return logs.find((l) => l.log_date === date);
}

/** The most recent log strictly before `date`, used to prefill sliders. */
export function previousLog(
  logs: readonly SoreLog[],
  date: DateKey
): SoreLog | undefined {
  return latestLog(logs.filter((l) => l.log_date < date));
}

/** Pain on a given date: today's log, else the latest earlier log. */
export function painOn(logs: readonly SoreLog[], date: DateKey): number | null {
  return (
    (logOn(logs, date) ?? previousLog(logs, date))?.pain ?? latestLog(logs)?.pain ?? null
  );
}

export function entryOn(data: UserDataset, date: DateKey) {
  return data.dailyEntries.find((e) => e.entry_date === date);
}

/** Factor ids that were on for a date (general ones, not sore-specific). */
export function factorIdsOn(data: UserDataset, date: DateKey): Set<string> {
  const entry = entryOn(data, date);
  if (!entry) return new Set();
  return new Set(
    data.entryFactors
      .filter((ef) => ef.daily_entry_id === entry.id && ef.sore_id === null)
      .map((ef) => ef.factor_id)
  );
}

/** Factors ordered by how often the user has logged them, presets after. */
export function factorsByUsage(data: UserDataset): Factor[] {
  const counts = new Map<string, number>();
  for (const ef of data.entryFactors)
    counts.set(ef.factor_id, (counts.get(ef.factor_id) ?? 0) + 1);
  return data.factors
    .filter((f) => f.archived_at === null)
    .slice()
    .sort((a, b) => {
      const ca = counts.get(a.id) ?? 0;
      const cb = counts.get(b.id) ?? 0;
      if (ca !== cb) return cb - ca;
      if (a.is_preset !== b.is_preset) return a.is_preset ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
}

/** Whether every active sore has a log for the date. */
export function checkInComplete(data: UserDataset, date: DateKey): boolean {
  const active = activeSoresOn(data, date);
  return active.length > 0 && active.every((s) => logOn(s.logs, date));
}

export function currentFlareDay(data: UserDataset, today: DateKey): number | null {
  // Walk backwards from today while at least one sore was active.
  let day = today;
  let count = 0;
  for (;;) {
    const any = data.sores.some(
      (s) => s.onset_date <= day && (s.healed_date === null || s.healed_date >= day)
    );
    if (!any) break;
    count++;
    day = addDays(day, -1);
    if (count > 3650) break;
  }
  return count || null;
}
