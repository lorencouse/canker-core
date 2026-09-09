import type {
  DailyEntry,
  DailyEntryInput,
  DateKey,
  EntryFactor,
  Factor,
  NewFactorInput,
  NewSoreInput,
  Profile,
  ProfileUpdateInput,
  Sore,
  SoreLog,
  SoreLogInput,
  UpdateSoreInput,
  UserDataset
} from '@canker/core';
import {
  archiveFactor,
  createFactor,
  createSore,
  deleteAllUserData,
  deleteSore,
  deleteSoreLog,
  fetchProfile,
  fetchUserDataset,
  markSoreHealed,
  reopenSore,
  setEntryFactor,
  updateProfile,
  updateSore,
  upsertDailyEntry,
  upsertSoreLog
} from '@canker/db';
import { env } from './env';
import { supabase } from './supabase';
import { demoBackend } from './demo/backend';

/**
 * Every read and write the app performs, with the transport left open. The
 * Supabase implementation is a thin pass-through to @canker/db; the demo
 * implementation keeps the same rows in memory so the app runs with no
 * backend at all. `lib/data.ts` only ever talks to this interface.
 */
export interface Backend {
  fetchUserDataset(userId: string): Promise<UserDataset>;
  fetchProfile(userId: string): Promise<Profile | null>;

  createSore(userId: string, input: NewSoreInput): Promise<{ sore: Sore; log: SoreLog }>;
  updateSore(soreId: string, input: UpdateSoreInput): Promise<Sore>;
  markSoreHealed(soreId: string, healedDate: DateKey): Promise<Sore>;
  reopenSore(soreId: string): Promise<Sore>;
  deleteSore(soreId: string): Promise<void>;

  upsertSoreLog(userId: string, input: SoreLogInput): Promise<SoreLog>;
  deleteSoreLog(logId: string): Promise<void>;

  upsertDailyEntry(userId: string, input: DailyEntryInput): Promise<DailyEntry>;
  setEntryFactor(
    userId: string,
    args: {
      entry_date: DateKey;
      factor_id: string;
      on: boolean;
      sore_id?: string | null;
    }
  ): Promise<EntryFactor | null>;

  createFactor(userId: string, input: NewFactorInput): Promise<Factor>;
  archiveFactor(factorId: string, archived: boolean): Promise<Factor>;

  updateProfile(userId: string, input: ProfileUpdateInput): Promise<Profile>;
  deleteAllUserData(userId: string): Promise<void>;
}

export const supabaseBackend: Backend = {
  fetchUserDataset: (userId) => fetchUserDataset(supabase, userId),
  fetchProfile: (userId) => fetchProfile(supabase, userId),

  createSore: (userId, input) => createSore(supabase, userId, input),
  updateSore: (soreId, input) => updateSore(supabase, soreId, input),
  markSoreHealed: (soreId, healedDate) => markSoreHealed(supabase, soreId, healedDate),
  reopenSore: (soreId) => reopenSore(supabase, soreId),
  deleteSore: (soreId) => deleteSore(supabase, soreId),

  upsertSoreLog: (userId, input) => upsertSoreLog(supabase, userId, input),
  deleteSoreLog: (logId) => deleteSoreLog(supabase, logId),

  upsertDailyEntry: (userId, input) => upsertDailyEntry(supabase, userId, input),
  setEntryFactor: (userId, args) => setEntryFactor(supabase, userId, args),

  createFactor: (userId, input) => createFactor(supabase, userId, input),
  archiveFactor: (factorId, archived) => archiveFactor(supabase, factorId, archived),

  updateProfile: (userId, input) => updateProfile(supabase, userId, input),
  deleteAllUserData: (userId) => deleteAllUserData(supabase, userId)
};

export const backend: Backend = env.demo ? demoBackend : supabaseBackend;
