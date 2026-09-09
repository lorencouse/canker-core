import type { UserDataset } from '@canker/core';
import type { CankerClient } from '../client';
import type { Tables } from '../database.types';

/**
 * Fetch everything the insights engine and the main screens need in one
 * round of parallel queries. A user's lifetime of daily data is small (a few
 * thousand rows at most), so one fetch + client-side derivation is simpler
 * and faster than many narrow queries.
 */
export async function fetchUserDataset(
  client: CankerClient,
  userId: string
): Promise<UserDataset> {
  const [sores, soreLogs, dailyEntries, factors, entryFactors] = await Promise.all([
    client
      .from('sores')
      .select('*')
      .eq('user_id', userId)
      .order('onset_date', { ascending: false }),
    client.from('sore_logs').select('*').eq('user_id', userId).order('log_date'),
    client.from('daily_entries').select('*').eq('user_id', userId).order('entry_date'),
    client
      .from('factors')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('name'),
    client.from('entry_factors').select('*').eq('user_id', userId)
  ]);

  const firstError = [sores, soreLogs, dailyEntries, factors, entryFactors].find(
    (r) => r.error
  )?.error;
  if (firstError) throw firstError;

  return {
    sores: (sores.data ?? []) as Tables<'sores'>[],
    soreLogs: (soreLogs.data ?? []) as Tables<'sore_logs'>[],
    dailyEntries: (dailyEntries.data ?? []) as Tables<'daily_entries'>[],
    factors: (factors.data ?? []) as Tables<'factors'>[],
    entryFactors: (entryFactors.data ?? []) as Tables<'entry_factors'>[]
  };
}

export async function fetchProfile(client: CankerClient, userId: string) {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
