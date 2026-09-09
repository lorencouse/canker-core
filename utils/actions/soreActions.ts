'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { pool } from '@/lib/db/pool';
import { Sore } from '@/types';

/**
 * Sore mutations.
 *
 * Supabase relied on RLS to stop one user writing another user's sores. There
 * is no RLS here, so ownership is enforced explicitly: the user id always comes
 * from the session, and deletes are scoped by `user_id` so a guessed id cannot
 * remove someone else's row.
 */

async function requireUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

export async function upsertSores(sores: Sore[]): Promise<void> {
  if (sores.length === 0) return;

  const userId = await requireUserId();
  if (!userId) {
    console.error('Error upserting sores: not authenticated');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const sore of sores) {
      await client.query(
        `insert into sores (id, user_id, zone, gums, x, y, dates, pain, size, healed)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (id) do update set
           zone   = excluded.zone,
           gums   = excluded.gums,
           x      = excluded.x,
           y      = excluded.y,
           dates  = excluded.dates,
           pain   = excluded.pain,
           size   = excluded.size,
           healed = excluded.healed
         where sores.user_id = $2`,
        [
          sore.id,
          // Ignore any user_id supplied by the client.
          userId,
          sore.zone,
          sore.gums,
          sore.x,
          sore.y,
          sore.dates,
          sore.pain,
          sore.size,
          sore.healed
        ]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error upserting sores:', error);
    return;
  } finally {
    client.release();
  }

  revalidatePath('/my-sores');
  revalidatePath('/history');
}

export async function deleteSore(soreId: string): Promise<void> {
  const userId = await requireUserId();
  if (!userId) {
    console.error('Error deleting sore: not authenticated');
    return;
  }

  try {
    await pool.query('delete from sores where id = $1 and user_id = $2', [soreId, userId]);
  } catch (error) {
    console.error('Error deleting sore:', error);
    return;
  }

  revalidatePath('/my-sores');
  revalidatePath('/history');
}
