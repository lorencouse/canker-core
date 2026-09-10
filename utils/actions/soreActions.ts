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
 * from the session, and every write is scoped by `user_id` so a guessed id
 * cannot touch someone else's row.
 *
 * Every action reports its outcome. The caller has already updated the screen
 * optimistically, so a swallowed failure would leave the map showing a state
 * the database never received.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const NOT_SIGNED_IN: ActionResult = {
  ok: false,
  error: 'Your session has expired. Sign in again to save.'
};

async function requireUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

function revalidate() {
  revalidatePath('/my-sores');
  revalidatePath('/history');
}

export async function upsertSores(sores: Sore[]): Promise<ActionResult> {
  if (sores.length === 0) return { ok: true };

  const userId = await requireUserId();
  if (!userId) return NOT_SIGNED_IN;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const sore of sores) {
      await client.query(
        `insert into sores (id, user_id, zone, view, x, y, dates, pain, size, healed)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (id) do update set
           zone   = excluded.zone,
           view   = excluded.view,
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
          sore.view,
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
    return { ok: false, error: 'Could not save your changes. Try again.' };
  } finally {
    client.release();
  }

  revalidate();
  return { ok: true };
}

/** Mark a sore healed (an ISO timestamp) or reopen it (null). */
export async function setSoreHealed(
  soreId: string,
  healed: string | null
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return NOT_SIGNED_IN;

  try {
    await pool.query(
      'update sores set healed = $1 where id = $2 and user_id = $3',
      [healed, soreId, userId]
    );
  } catch (error) {
    console.error('Error updating healed state:', error);
    return { ok: false, error: 'Could not update the sore. Try again.' };
  }

  revalidate();
  return { ok: true };
}

export async function deleteSore(soreId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return NOT_SIGNED_IN;

  try {
    await pool.query('delete from sores where id = $1 and user_id = $2', [soreId, userId]);
  } catch (error) {
    console.error('Error deleting sore:', error);
    return { ok: false, error: 'Could not delete the sore. Try again.' };
  }

  revalidate();
  return { ok: true };
}
