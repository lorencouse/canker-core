import type {
  DailyEntry,
  DateKey,
  EntryFactor,
  Factor,
  Profile,
  Sore,
  SoreLog,
  UserDataset
} from '@canker/core';
import type { Backend } from '../backend';
import { buildDemoState, type DemoState } from './dataset';

/**
 * The in-memory backend. It holds the same rows a Postgres database would and
 * enforces the same constraints the schema does: one log per (sore, day), one
 * entry per (user, day), entry_factors unique on (entry, factor, sore), and a
 * cascade from sores to their logs and entry_factors.
 *
 * Writes are persisted to localStorage so edits survive a reload, and every
 * call waits a beat so loading states and optimistic updates behave the way
 * they do against a real network.
 */

export const DEMO_STORAGE_KEY = 'canker.demo.state';

const LATENCY_MS = 120;

let state: DemoState | null = null;

function load(): DemoState {
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    // Corrupt or unavailable storage: fall back to a freshly generated set.
  }
  return buildDemoState();
}

function current(): DemoState {
  state ??= load();
  return state;
}

function persist(): void {
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(current()));
  } catch {
    // Private browsing or a full quota: the session still works in memory.
  }
}

/** Throw away every local edit and regenerate the dataset relative to today. */
export function resetDemoState(): void {
  try {
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
  state = buildDemoState();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Run a write after the simulated round trip, then save the result. */
async function write<T>(fn: (s: DemoState) => T): Promise<T> {
  await sleep(LATENCY_MS);
  const result = fn(current());
  persist();
  return clone(result);
}

async function read<T>(fn: (s: DemoState) => T): Promise<T> {
  await sleep(LATENCY_MS);
  return clone(fn(current()));
}

/** Rows leave the store by value, exactly as they would over the wire. */
function clone<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value ?? null)) as T);
}

function newId(): string {
  return crypto.randomUUID();
}

function requireSore(s: DemoState, soreId: string): Sore {
  const sore = s.dataset.sores.find((row) => row.id === soreId);
  if (!sore) throw new Error(`Demo: no sore ${soreId}`);
  return sore;
}

/** The upsert behind `daily_entries (user_id, entry_date)`. Only given fields change. */
function upsertEntry(
  s: DemoState,
  userId: string,
  input: {
    entry_date: DateKey;
    stress?: number | null;
    sleep_quality?: number | null;
    overall_pain?: number | null;
    notes?: string | null;
    logged_late?: boolean;
  }
): DailyEntry {
  const existing = s.dataset.dailyEntries.find((e) => e.entry_date === input.entry_date);
  if (existing) {
    if (input.stress !== undefined) existing.stress = input.stress;
    if (input.sleep_quality !== undefined) existing.sleep_quality = input.sleep_quality;
    if (input.overall_pain !== undefined) existing.overall_pain = input.overall_pain;
    if (input.notes !== undefined) existing.notes = input.notes;
    if (input.logged_late !== undefined) existing.logged_late = input.logged_late;
    return existing;
  }
  const entry: DailyEntry = {
    id: newId(),
    user_id: userId,
    entry_date: input.entry_date,
    stress: input.stress ?? null,
    sleep_quality: input.sleep_quality ?? null,
    overall_pain: input.overall_pain ?? null,
    notes: input.notes ?? null,
    logged_late: input.logged_late ?? false
  };
  s.dataset.dailyEntries.push(entry);
  return entry;
}

export const demoBackend: Backend = {
  fetchUserDataset(): Promise<UserDataset> {
    return read((s) => {
      const d = s.dataset;
      return {
        sores: [...d.sores].sort((a, b) => (a.onset_date < b.onset_date ? 1 : -1)),
        soreLogs: [...d.soreLogs].sort((a, b) => (a.log_date < b.log_date ? -1 : 1)),
        dailyEntries: [...d.dailyEntries].sort((a, b) =>
          a.entry_date < b.entry_date ? -1 : 1
        ),
        factors: [...d.factors].sort((a, b) => (a.name < b.name ? -1 : 1)),
        entryFactors: [...d.entryFactors]
      };
    });
  },

  fetchProfile(): Promise<Profile | null> {
    return read((s) => s.profile);
  },

  createSore(userId, input) {
    return write((s) => {
      const { size_mm, pain, ...fields } = input;
      const sore: Sore = {
        id: newId(),
        user_id: userId,
        surface: fields.surface,
        x: fields.x,
        y: fields.y,
        onset_date: fields.onset_date,
        healed_date: null,
        notes: fields.notes ?? null
      };
      const log: SoreLog = {
        id: newId(),
        sore_id: sore.id,
        user_id: userId,
        log_date: input.onset_date,
        size_mm,
        pain,
        notes: null,
        logged_late: false
      };
      s.dataset.sores.unshift(sore);
      s.dataset.soreLogs.push(log);
      return { sore, log };
    });
  },

  updateSore(soreId, input) {
    return write((s) => Object.assign(requireSore(s, soreId), input));
  },

  markSoreHealed(soreId, healedDate) {
    return write((s) => {
      const sore = requireSore(s, soreId);
      sore.healed_date = healedDate;
      return sore;
    });
  },

  reopenSore(soreId) {
    return write((s) => {
      const sore = requireSore(s, soreId);
      sore.healed_date = null;
      return sore;
    });
  },

  deleteSore(soreId) {
    return write((s) => {
      // `on delete cascade` from sores to sore_logs and entry_factors.sore_id.
      s.dataset.sores = s.dataset.sores.filter((row) => row.id !== soreId);
      s.dataset.soreLogs = s.dataset.soreLogs.filter((row) => row.sore_id !== soreId);
      s.dataset.entryFactors = s.dataset.entryFactors.filter(
        (row) => row.sore_id !== soreId
      );
    });
  },

  upsertSoreLog(userId, input) {
    return write((s) => {
      const existing = s.dataset.soreLogs.find(
        (l) => l.sore_id === input.sore_id && l.log_date === input.log_date
      );
      const next: SoreLog = {
        id: existing?.id ?? newId(),
        sore_id: input.sore_id,
        user_id: userId,
        log_date: input.log_date,
        size_mm: input.size_mm,
        pain: input.pain,
        notes: input.notes ?? null,
        logged_late: input.logged_late ?? false
      };
      if (existing) Object.assign(existing, next);
      else s.dataset.soreLogs.push(next);
      return next;
    });
  },

  deleteSoreLog(logId) {
    return write((s) => {
      s.dataset.soreLogs = s.dataset.soreLogs.filter((row) => row.id !== logId);
    });
  },

  upsertDailyEntry(userId, input) {
    return write((s) => upsertEntry(s, userId, input));
  },

  setEntryFactor(userId, args): Promise<EntryFactor | null> {
    return write((s) => {
      const entry = upsertEntry(s, userId, { entry_date: args.entry_date });
      const soreId = args.sore_id ?? null;
      const matches = (ef: EntryFactor) =>
        ef.daily_entry_id === entry.id &&
        ef.factor_id === args.factor_id &&
        ef.sore_id === soreId;

      if (!args.on) {
        s.dataset.entryFactors = s.dataset.entryFactors.filter((ef) => !matches(ef));
        return null;
      }
      // `unique nulls not distinct (daily_entry_id, factor_id, sore_id)`.
      const existing = s.dataset.entryFactors.find(matches);
      if (existing) return existing;
      const row: EntryFactor = {
        id: newId(),
        daily_entry_id: entry.id,
        factor_id: args.factor_id,
        user_id: userId,
        sore_id: soreId,
        detail: null
      };
      s.dataset.entryFactors.push(row);
      return row;
    });
  },

  createFactor(userId, input) {
    return write((s) => {
      const factor: Factor = {
        id: newId(),
        user_id: userId,
        kind: input.kind,
        name: input.name,
        is_preset: false,
        archived_at: null
      };
      s.dataset.factors.push(factor);
      return factor;
    });
  },

  archiveFactor(factorId, archived) {
    return write((s) => {
      const factor = s.dataset.factors.find((f) => f.id === factorId);
      if (!factor) throw new Error(`Demo: no factor ${factorId}`);
      factor.archived_at = archived ? new Date().toISOString() : null;
      return factor;
    });
  },

  updateProfile(_userId, input) {
    return write((s) => Object.assign(s.profile, input));
  },

  deleteAllUserData(userId) {
    return write((s) => {
      // Deleting sores, daily_entries and the user's factors cascades to every
      // sore_log and entry_factor. Presets belong to nobody and survive.
      s.dataset.sores = [];
      s.dataset.soreLogs = [];
      s.dataset.dailyEntries = [];
      s.dataset.entryFactors = [];
      s.dataset.factors = s.dataset.factors.filter((f) => f.user_id !== userId);
    });
  }
};
