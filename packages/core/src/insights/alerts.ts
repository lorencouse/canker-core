import type { DateKey } from '../dates';
import { addDays } from '../dates';
import { LONG_SORE_DAYS } from '../pain';
import { SURFACE_LABELS } from '../surfaces';
import type { DailyEntry, Sore, SoreLog } from '../types';
import type { Alert, SoreSummary } from './types';

/** Onsets are counted over this many calendar days ending today (inclusive). */
export const FREQUENT_ONSET_WINDOW_DAYS = 30;
/** This many onsets inside the window raises 'frequent_onsets'. */
export const FREQUENT_ONSET_THRESHOLD = 3;

/**
 * Plain-language nudges. None of them names a medical condition; they only
 * point at durations and counts the user can verify themselves.
 * `dailyEntries` is accepted for signature stability; the current rules do
 * not read it (a check-in is a sore log for an active sore).
 */
export function computeAlerts(
  soreSummaries: readonly SoreSummary[],
  sores: readonly Sore[],
  soreLogs: readonly SoreLog[],
  dailyEntries: readonly DailyEntry[],
  today: DateKey
): Alert[] {
  void dailyEntries;
  return [
    ...longRunningSoreAlerts(soreSummaries),
    ...frequentOnsetAlerts(sores, today),
    ...noLogTodayAlerts(sores, soreLogs, today)
  ];
}

/** Rule: one alert per active sore open for more than LONG_SORE_DAYS. */
function longRunningSoreAlerts(soreSummaries: readonly SoreSummary[]): Alert[] {
  return soreSummaries
    .filter((s) => s.healed_date === null && s.duration_days > LONG_SORE_DAYS)
    .map((s) => ({
      kind: 'long_running_sore' as const,
      sore_id: s.sore_id,
      message:
        `Your ${describeSore(s)} has been open for ${s.duration_days} days. ` +
        'Sores that last more than two weeks are worth showing a dentist or doctor.'
    }));
}

/** Rule: FREQUENT_ONSET_THRESHOLD or more onsets in the last FREQUENT_ONSET_WINDOW_DAYS days. */
function frequentOnsetAlerts(sores: readonly Sore[], today: DateKey): Alert[] {
  const windowStart = addDays(today, -(FREQUENT_ONSET_WINDOW_DAYS - 1));
  const recent = sores.filter(
    (s) => s.onset_date >= windowStart && s.onset_date <= today
  ).length;
  if (recent < FREQUENT_ONSET_THRESHOLD) return [];
  return [
    {
      kind: 'frequent_onsets',
      message:
        `You've had ${recent} new sores in the last ${FREQUENT_ONSET_WINDOW_DAYS} days. ` +
        'Frequent sores are worth mentioning to a clinician.'
    }
  ];
}

/** Rule: at least one active sore and no sore_log dated today for any active sore. */
function noLogTodayAlerts(
  sores: readonly Sore[],
  soreLogs: readonly SoreLog[],
  today: DateKey
): Alert[] {
  const activeIds = new Set(sores.filter((s) => s.healed_date === null).map((s) => s.id));
  if (activeIds.size === 0) return [];
  const loggedToday = soreLogs.some(
    (l) => l.log_date === today && activeIds.has(l.sore_id)
  );
  if (loggedToday) return [];
  return [{ kind: 'no_log_today', message: "You haven't logged today's check-in yet." }];
}

/** "left cheek sore", or just "sore" for the catch-all surface. */
function describeSore(s: SoreSummary): string {
  return s.surface === 'other'
    ? 'sore'
    : `${SURFACE_LABELS[s.surface].toLowerCase()} sore`;
}
