'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { PoolClient } from 'pg';

import { auth } from '@/lib/auth';
import { pool } from '@/lib/db/pool';
import type { DayLog, Sore } from '@/types';
import { TREATMENTS, TRIGGERS, pickKnown } from '@/utils/day-log';

/**
 * Sore and day-log mutations.
 *
 * There is no row-level security, so ownership is enforced here: the user id
 * always comes from the session, and every write is scoped by `user_id` so a
 * guessed id cannot touch someone else's row.
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
  revalidatePath('/today');
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Write one sore and bring its readings in line with the client's list. */
async function writeSore(client: PoolClient, userId: string, sore: Sore) {
  const { rowCount } = await client.query(
    `insert into sores (id, user_id, view, x, y, zone, created_at, healed_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (id) do update set
       view      = excluded.view,
       x         = excluded.x,
       y         = excluded.y,
       zone      = excluded.zone,
       healed_at = excluded.healed_at
     where sores.user_id = $2`,
    [
      sore.id,
      // Ignore any user_id supplied by the client.
      userId,
      sore.view,
      sore.x,
      sore.y,
      String(sore.zone).slice(0, 60),
      sore.created_at,
      sore.healed_at
    ]
  );
  // A conflicting id owned by someone else updates nothing; leave their
  // readings alone too.
  if (!rowCount) return;

  const keep = sore.readings.map((r) => r.id);
  await client.query(
    'delete from readings where sore_id = $1 and not (id = any($2::text[]))',
    [sore.id, keep]
  );
  for (const r of sore.readings) {
    await client.query(
      `insert into readings (id, sore_id, recorded_at, size, pain, note)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update set
         recorded_at = excluded.recorded_at,
         size        = excluded.size,
         pain        = excluded.pain,
         note        = excluded.note
       where readings.sore_id = $2`,
      [
        r.id,
        sore.id,
        r.recorded_at,
        clamp(Number(r.size) || 1, 0.5, 50),
        clamp(Math.round(Number(r.pain) || 1), 1, 10),
        r.note ? String(r.note).slice(0, 500) : null
      ]
    );
  }
}

export async function upsertSores(sores: Sore[]): Promise<ActionResult> {
  if (sores.length === 0) return { ok: true };

  const userId = await requireUserId();
  if (!userId) return NOT_SIGNED_IN;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const sore of sores) await writeSore(client, userId, sore);
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
  healedAt: string | null
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return NOT_SIGNED_IN;

  try {
    await pool.query(
      'update sores set healed_at = $1 where id = $2 and user_id = $3',
      [healedAt, soreId, userId]
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

/**
 * Save the log for one day. An empty log (no tags, no note) deletes the row
 * rather than storing a blank, so "days with a log" stays a meaningful count.
 */
export async function saveDayLog(log: DayLog): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return NOT_SIGNED_IN;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(log.day)) {
    return { ok: false, error: 'That is not a valid day.' };
  }
  const triggers = pickKnown(log.triggers, TRIGGERS);
  const treatments = pickKnown(log.treatments, TREATMENTS);
  const note = log.note?.trim() ? log.note.trim().slice(0, 1000) : null;

  try {
    if (!triggers.length && !treatments.length && !note) {
      await pool.query('delete from day_logs where user_id = $1 and day = $2', [userId, log.day]);
    } else {
      await pool.query(
        `insert into day_logs (user_id, day, triggers, treatments, note)
         values ($1, $2, $3, $4, $5)
         on conflict (user_id, day) do update set
           triggers   = excluded.triggers,
           treatments = excluded.treatments,
           note       = excluded.note`,
        [userId, log.day, triggers, treatments, note]
      );
    }
  } catch (error) {
    console.error('Error saving day log:', error);
    return { ok: false, error: 'Could not save today’s log. Try again.' };
  }

  revalidate();
  return { ok: true };
}
