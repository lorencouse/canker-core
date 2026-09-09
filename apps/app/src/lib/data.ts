import {
  todayKey,
  type DailyEntryInput,
  type DateKey,
  type NewFactorInput,
  type NewSoreInput,
  type Profile,
  type ProfileUpdateInput,
  type SoreLogInput,
  type UpdateSoreInput,
  type UserDataset
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
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { useUser } from './auth';
import { supabase } from './supabase';

/**
 * All server state for the signed-in user lives in two queries: the profile
 * and the full dataset. Mutations update the dataset cache optimistically and
 * refetch in the background. Keeping one dataset query makes offline replay
 * and cache invalidation trivial.
 */

export const keys = {
  profile: (userId: string) => ['profile', userId] as const,
  dataset: (userId: string) => ['dataset', userId] as const
};

export function useProfile() {
  const user = useUser();
  return useQuery({
    queryKey: keys.profile(user.id),
    queryFn: () => fetchProfile(supabase, user.id)
  });
}

export function useDataset() {
  const user = useUser();
  return useQuery({
    queryKey: keys.dataset(user.id),
    queryFn: () => fetchUserDataset(supabase, user.id)
  });
}

/** Today's date key in the user's saved timezone, falling back to the device zone. */
export function useToday(): DateKey {
  const profile = useProfile();
  const tz = profile.data?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  return useMemo(() => todayKey(tz), [tz]);
}

const EMPTY: UserDataset = {
  sores: [],
  soreLogs: [],
  dailyEntries: [],
  factors: [],
  entryFactors: []
};

function patchDataset(
  qc: QueryClient,
  userId: string,
  fn: (d: UserDataset) => UserDataset
) {
  qc.setQueryData<UserDataset>(keys.dataset(userId), (old) => fn(old ?? EMPTY));
}

function tempId() {
  return `temp-${crypto.randomUUID()}`;
}

/* ------------------------------------------------------------------------ */
/* Sores                                                                     */
/* ------------------------------------------------------------------------ */

export function useCreateSore() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewSoreInput) => createSore(supabase, user.id, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: keys.dataset(user.id) });
      const soreId = tempId();
      patchDataset(qc, user.id, (d) => ({
        ...d,
        sores: [
          {
            id: soreId,
            user_id: user.id,
            surface: input.surface,
            x: input.x,
            y: input.y,
            onset_date: input.onset_date,
            healed_date: null,
            notes: input.notes ?? null
          },
          ...d.sores
        ],
        soreLogs: [
          ...d.soreLogs,
          {
            id: tempId(),
            sore_id: soreId,
            user_id: user.id,
            log_date: input.onset_date,
            size_mm: input.size_mm,
            pain: input.pain,
            notes: null,
            logged_late: false
          }
        ]
      }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dataset(user.id) })
  });
}

export function useUpdateSore() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ soreId, input }: { soreId: string; input: UpdateSoreInput }) =>
      updateSore(supabase, soreId, input),
    onMutate: async ({ soreId, input }) => {
      await qc.cancelQueries({ queryKey: keys.dataset(user.id) });
      patchDataset(qc, user.id, (d) => ({
        ...d,
        sores: d.sores.map((s) => (s.id === soreId ? { ...s, ...input } : s))
      }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dataset(user.id) })
  });
}

export function useSetHealed() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      soreId,
      healedDate
    }: {
      soreId: string;
      healedDate: DateKey | null;
    }) =>
      healedDate
        ? markSoreHealed(supabase, soreId, healedDate)
        : reopenSore(supabase, soreId),
    onMutate: async ({ soreId, healedDate }) => {
      await qc.cancelQueries({ queryKey: keys.dataset(user.id) });
      patchDataset(qc, user.id, (d) => ({
        ...d,
        sores: d.sores.map((s) =>
          s.id === soreId ? { ...s, healed_date: healedDate } : s
        )
      }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dataset(user.id) })
  });
}

export function useDeleteSore() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (soreId: string) => deleteSore(supabase, soreId),
    onMutate: async (soreId) => {
      await qc.cancelQueries({ queryKey: keys.dataset(user.id) });
      patchDataset(qc, user.id, (d) => ({
        ...d,
        sores: d.sores.filter((s) => s.id !== soreId),
        soreLogs: d.soreLogs.filter((l) => l.sore_id !== soreId),
        entryFactors: d.entryFactors.filter((ef) => ef.sore_id !== soreId)
      }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dataset(user.id) })
  });
}

/* ------------------------------------------------------------------------ */
/* Logs                                                                      */
/* ------------------------------------------------------------------------ */

export function useUpsertSoreLog() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SoreLogInput) => upsertSoreLog(supabase, user.id, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: keys.dataset(user.id) });
      patchDataset(qc, user.id, (d) => {
        const existing = d.soreLogs.find(
          (l) => l.sore_id === input.sore_id && l.log_date === input.log_date
        );
        const next = {
          id: existing?.id ?? tempId(),
          sore_id: input.sore_id,
          user_id: user.id,
          log_date: input.log_date,
          size_mm: input.size_mm,
          pain: input.pain,
          notes: input.notes ?? existing?.notes ?? null,
          logged_late: input.logged_late ?? existing?.logged_late ?? false
        };
        return {
          ...d,
          soreLogs: existing
            ? d.soreLogs.map((l) => (l.id === existing.id ? next : l))
            : [...d.soreLogs, next]
        };
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dataset(user.id) })
  });
}

export function useDeleteSoreLog() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) => deleteSoreLog(supabase, logId),
    onMutate: async (logId) => {
      await qc.cancelQueries({ queryKey: keys.dataset(user.id) });
      patchDataset(qc, user.id, (d) => ({
        ...d,
        soreLogs: d.soreLogs.filter((l) => l.id !== logId)
      }));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dataset(user.id) })
  });
}

/* ------------------------------------------------------------------------ */
/* Daily entries and factors                                                 */
/* ------------------------------------------------------------------------ */

export function useUpsertDailyEntry() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DailyEntryInput) => upsertDailyEntry(supabase, user.id, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: keys.dataset(user.id) });
      patchDataset(qc, user.id, (d) => {
        const existing = d.dailyEntries.find((e) => e.entry_date === input.entry_date);
        const next = {
          id: existing?.id ?? tempId(),
          user_id: user.id,
          entry_date: input.entry_date,
          stress: input.stress !== undefined ? input.stress : (existing?.stress ?? null),
          sleep_quality:
            input.sleep_quality !== undefined
              ? input.sleep_quality
              : (existing?.sleep_quality ?? null),
          overall_pain:
            input.overall_pain !== undefined
              ? input.overall_pain
              : (existing?.overall_pain ?? null),
          notes:
            input.notes !== undefined ? (input.notes ?? null) : (existing?.notes ?? null),
          logged_late: input.logged_late ?? existing?.logged_late ?? false
        };
        return {
          ...d,
          dailyEntries: existing
            ? d.dailyEntries.map((e) => (e.id === existing.id ? next : e))
            : [...d.dailyEntries, next]
        };
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dataset(user.id) })
  });
}

export function useToggleFactor() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      entry_date: DateKey;
      factor_id: string;
      on: boolean;
      sore_id?: string | null;
    }) => setEntryFactor(supabase, user.id, args),
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: keys.dataset(user.id) });
      patchDataset(qc, user.id, (d) => {
        let entries = d.dailyEntries;
        let entry = entries.find((e) => e.entry_date === args.entry_date);
        if (!entry) {
          entry = {
            id: tempId(),
            user_id: user.id,
            entry_date: args.entry_date,
            stress: null,
            sleep_quality: null,
            overall_pain: null,
            notes: null,
            logged_late: false
          };
          entries = [...entries, entry];
        }
        const soreId = args.sore_id ?? null;
        const entryId = entry.id;
        const without = d.entryFactors.filter(
          (ef) =>
            !(
              ef.daily_entry_id === entryId &&
              ef.factor_id === args.factor_id &&
              ef.sore_id === soreId
            )
        );
        return {
          ...d,
          dailyEntries: entries,
          entryFactors: args.on
            ? [
                ...without,
                {
                  id: tempId(),
                  daily_entry_id: entryId,
                  factor_id: args.factor_id,
                  user_id: user.id,
                  sore_id: soreId,
                  detail: null
                }
              ]
            : without
        };
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dataset(user.id) })
  });
}

export function useCreateFactor() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewFactorInput) => createFactor(supabase, user.id, input),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dataset(user.id) })
  });
}

export function useArchiveFactor() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ factorId, archived }: { factorId: string; archived: boolean }) =>
      archiveFactor(supabase, factorId, archived),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dataset(user.id) })
  });
}

/* ------------------------------------------------------------------------ */
/* Profile                                                                   */
/* ------------------------------------------------------------------------ */

export function useUpdateProfile() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => updateProfile(supabase, user.id, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: keys.profile(user.id) });
      qc.setQueryData<Profile | null>(keys.profile(user.id), (old) =>
        old ? { ...old, ...input } : old
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.profile(user.id) })
  });
}

export function useDeleteAllData() {
  const user = useUser();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteAllUserData(supabase, user.id),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.dataset(user.id) })
  });
}
