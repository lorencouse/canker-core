'use server';

import { createClient } from '@/utils/supabase/server';
import { Sore } from '@/types';

export async function upsertSores(sores: Sore[]): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('sores').upsert(sores);

  if (error) {
    console.error('Error upserting sores:', error);
  }
}

export async function deleteSore(soreId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('sores').delete().eq('id', soreId);

  if (error) {
    console.error('Error deleting sore:', error);
  }
}
