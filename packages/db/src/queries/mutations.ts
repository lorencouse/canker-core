import type {
  DailyEntryInput,
  NewFactorInput,
  NewSoreInput,
  ProfileUpdateInput,
  SoreLogInput,
  UpdateSoreInput
} from '@canker/core';
import type { CankerClient } from '../client';
import type { Tables } from '../database.types';

/**
 * Every write the app performs. Each function takes an already-validated
 * input (see @canker/core schemas) and returns the affected row(s).
 */

export async function createSore(
  client: CankerClient,
  userId: string,
  input: NewSoreInput
): Promise<{ sore: Tables<'sores'>; log: Tables<'sore_logs'> }> {
  const { size_mm, pain, ...soreFields } = input;
  const { data: sore, error } = await client
    .from('sores')
    .insert({ ...soreFields, notes: soreFields.notes ?? null, user_id: userId })
    .select()
    .single();
  if (error) throw error;

  const { data: log, error: logError } = await client
    .from('sore_logs')
    .insert({
      sore_id: sore.id,
      user_id: userId,
      log_date: input.onset_date,
      size_mm,
      pain
    })
    .select()
    .single();
  if (logError) throw logError;

  return { sore, log };
}

export async function updateSore(
  client: CankerClient,
  soreId: string,
  input: UpdateSoreInput
) {
  const { data, error } = await client
    .from('sores')
    .update(input)
    .eq('id', soreId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markSoreHealed(
  client: CankerClient,
  soreId: string,
  healedDate: string
) {
  return updateSore(client, soreId, { healed_date: healedDate });
}

export async function reopenSore(client: CankerClient, soreId: string) {
  return updateSore(client, soreId, { healed_date: null });
}

export async function deleteSore(client: CankerClient, soreId: string) {
  const { error } = await client.from('sores').delete().eq('id', soreId);
  if (error) throw error;
}

/** Insert or overwrite the observation for one sore on one day. */
export async function upsertSoreLog(
  client: CankerClient,
  userId: string,
  input: SoreLogInput
) {
  const { data, error } = await client
    .from('sore_logs')
    .upsert(
      {
        sore_id: input.sore_id,
        user_id: userId,
        log_date: input.log_date,
        size_mm: input.size_mm,
        pain: input.pain,
        notes: input.notes ?? null,
        logged_late: input.logged_late ?? false
      },
      { onConflict: 'sore_id,log_date' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSoreLog(client: CankerClient, logId: string) {
  const { error } = await client.from('sore_logs').delete().eq('id', logId);
  if (error) throw error;
}

/** Insert or update the day-level entry. Only provided fields are changed. */
export async function upsertDailyEntry(
  client: CankerClient,
  userId: string,
  input: DailyEntryInput
) {
  const { data, error } = await client
    .from('daily_entries')
    .upsert(
      {
        user_id: userId,
        entry_date: input.entry_date,
        ...(input.stress !== undefined ? { stress: input.stress } : {}),
        ...(input.sleep_quality !== undefined
          ? { sleep_quality: input.sleep_quality }
          : {}),
        ...(input.overall_pain !== undefined ? { overall_pain: input.overall_pain } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.logged_late !== undefined ? { logged_late: input.logged_late } : {})
      },
      { onConflict: 'user_id,entry_date' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Toggle a factor on a day. Creates the daily entry if needed. Returns the
 * entry_factors row when turned on, or null when turned off.
 */
export async function setEntryFactor(
  client: CankerClient,
  userId: string,
  args: { entry_date: string; factor_id: string; on: boolean; sore_id?: string | null }
) {
  const entry = await upsertDailyEntry(client, userId, { entry_date: args.entry_date });

  if (!args.on) {
    let q = client
      .from('entry_factors')
      .delete()
      .eq('daily_entry_id', entry.id)
      .eq('factor_id', args.factor_id);
    q = args.sore_id ? q.eq('sore_id', args.sore_id) : q.is('sore_id', null);
    const { error } = await q;
    if (error) throw error;
    return null;
  }

  const { data, error } = await client
    .from('entry_factors')
    .upsert(
      {
        daily_entry_id: entry.id,
        factor_id: args.factor_id,
        user_id: userId,
        sore_id: args.sore_id ?? null
      },
      { onConflict: 'daily_entry_id,factor_id,sore_id', ignoreDuplicates: true }
    )
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createFactor(
  client: CankerClient,
  userId: string,
  input: NewFactorInput
) {
  const { data, error } = await client
    .from('factors')
    .insert({ ...input, user_id: userId, is_preset: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function archiveFactor(
  client: CankerClient,
  factorId: string,
  archived: boolean
) {
  const { data, error } = await client
    .from('factors')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', factorId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(
  client: CankerClient,
  userId: string,
  input: ProfileUpdateInput
) {
  const { data, error } = await client
    .from('profiles')
    .update(input)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Remove every row the user owns. Used by "Delete my data". Auth user is kept. */
export async function deleteAllUserData(client: CankerClient, userId: string) {
  // sores cascades to sore_logs, sore_photos and entry_factors.sore_id rows.
  const results = await Promise.all([
    client.from('sores').delete().eq('user_id', userId),
    client.from('daily_entries').delete().eq('user_id', userId),
    client.from('factors').delete().eq('user_id', userId)
  ]);
  const err = results.find((r) => r.error)?.error;
  if (err) throw err;
}
