import type { DateKey } from '../dates';
import { eachDay } from '../dates';
import type {
  DailyEntry,
  EntryFactor,
  Factor,
  Sore,
  SoreLog,
  UserDataset
} from '../types';

/**
 * Test-only factories. Every maker fills sensible defaults and lets a test
 * override just the fields it cares about. Daily entry ids are derived from
 * their date (`entry-YYYY-MM-DD`) so entry factors can be attached by date.
 */

export const USER_ID = 'user-1';

let seq = 0;
function nextId(prefix: string): string {
  return `${prefix}-${++seq}`;
}

export function entryId(date: DateKey): string {
  return `entry-${date}`;
}

export function makeSore(over: Partial<Sore> = {}): Sore {
  return {
    id: nextId('sore'),
    user_id: USER_ID,
    surface: 'cheek_left',
    x: 0.5,
    y: 0.5,
    onset_date: '2026-01-01',
    healed_date: null,
    notes: null,
    ...over
  };
}

export function makeLog(
  over: Partial<SoreLog> & Pick<SoreLog, 'sore_id' | 'log_date'>
): SoreLog {
  return {
    id: nextId('log'),
    user_id: USER_ID,
    size_mm: 3,
    pain: 3,
    notes: null,
    logged_late: false,
    ...over
  };
}

export function makeEntry(
  over: Partial<DailyEntry> & Pick<DailyEntry, 'entry_date'>
): DailyEntry {
  return {
    id: entryId(over.entry_date),
    user_id: USER_ID,
    stress: null,
    sleep_quality: null,
    overall_pain: null,
    notes: null,
    logged_late: false,
    ...over
  };
}

/** One daily entry for every day in [start, end]. */
export function makeEntries(
  start: DateKey,
  end: DateKey,
  over: Partial<Omit<DailyEntry, 'id' | 'entry_date'>> = {}
): DailyEntry[] {
  return eachDay(start, end).map((entry_date) => makeEntry({ entry_date, ...over }));
}

export function makeFactor(over: Partial<Factor> = {}): Factor {
  return {
    id: nextId('factor'),
    user_id: USER_ID,
    kind: 'food',
    name: 'Factor',
    is_preset: false,
    archived_at: null,
    ...over
  };
}

/** Attach a factor to the daily entry of `date` (or an explicit daily_entry_id). */
export function makeEntryFactor(
  over: Partial<EntryFactor> & Pick<EntryFactor, 'factor_id'> & { date?: DateKey }
): EntryFactor {
  const { date, ...rest } = over;
  return {
    id: nextId('ef'),
    daily_entry_id: date === undefined ? entryId('2026-01-01') : entryId(date),
    user_id: USER_ID,
    sore_id: null,
    detail: null,
    ...rest
  };
}

export function buildDataset(parts: Partial<UserDataset> = {}): UserDataset {
  return {
    sores: [],
    soreLogs: [],
    dailyEntries: [],
    factors: [],
    entryFactors: [],
    ...parts
  };
}
