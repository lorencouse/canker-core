'use server';

import { revalidatePath } from 'next/cache';

import { pool } from '@/lib/db/pool';
import type { DayLog } from '@/types';
import {
  NOT_SIGNED_IN,
  requireUserId,
  type ActionResult
} from '@/utils/actions/session';
import {
  applyPatch,
  isBlankDayLog,
  validatePatch,
  type DayPatch
} from '@/utils/check-in/patch';

/** Partial day saves and check-in status; ownership rules as in `soreActions`. */

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const BAD_DAY: ActionResult = { ok: false, error: 'That is not a valid day.' };

function revalidate() {
  revalidatePath('/today');
  revalidatePath('/insights');
}

/**
 * Save one check-in step. The row is locked, patched in TypeScript and
 * written back; a row left with no data at all is deleted rather than stored
 * blank.
 */
export async function saveDayPatch(
  day: string,
  patch: DayPatch
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return NOT_SIGNED_IN;
  if (typeof day !== 'string' || !DAY.test(day)) return BAD_DAY;
  const valid = validatePatch(patch);
  if (!valid) return { ok: false, error: 'That answer could not be saved.' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<DayLog>(
      `select to_char(day, 'YYYY-MM-DD') as day, triggers, treatments, note,
              sleep_hours::float8 as sleep_hours, sleep_quality, sleep_source,
              stress, food_answered, health_answered
         from day_logs where user_id = $1 and day = $2 for update`,
      [userId, day]
    );
    const next = applyPatch(rows[0] ?? null, day, valid);
    if (isBlankDayLog(next)) {
      await client.query(
        'delete from day_logs where user_id = $1 and day = $2',
        [userId, day]
      );
    } else {
      await client.query(
        `insert into day_logs
           (user_id, day, triggers, treatments, note, sleep_hours,
            sleep_quality, sleep_source, stress, food_answered, health_answered)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         on conflict (user_id, day) do update set
           triggers        = excluded.triggers,
           treatments      = excluded.treatments,
           note            = excluded.note,
           sleep_hours     = excluded.sleep_hours,
           sleep_quality   = excluded.sleep_quality,
           sleep_source    = excluded.sleep_source,
           stress          = excluded.stress,
           food_answered   = excluded.food_answered,
           health_answered = excluded.health_answered`,
        [
          userId,
          day,
          next.triggers,
          next.treatments,
          next.note,
          next.sleep_hours,
          next.sleep_quality,
          next.sleep_source,
          next.stress,
          next.food_answered,
          next.health_answered
        ]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving day patch:', error);
    return { ok: false, error: 'Could not save that answer. Try again.' };
  } finally {
    client.release();
  }

  revalidate();
  return { ok: true };
}

/** Record that the day's check-in was finished or skipped; skipped never undoes done. */
export async function setCheckInStatus(
  day: string,
  status: 'done' | 'skipped'
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return NOT_SIGNED_IN;
  if (typeof day !== 'string' || !DAY.test(day)) return BAD_DAY;
  if (status !== 'done' && status !== 'skipped') {
    return { ok: false, error: 'That is not a valid status.' };
  }

  try {
    await pool.query(
      `insert into check_ins (user_id, day, status) values ($1, $2, $3)
       on conflict (user_id, day) do update
         set status = excluded.status, updated_at = now()
         where check_ins.status <> 'done'`,
      [userId, day, status]
    );
  } catch (error) {
    console.error('Error saving check-in status:', error);
    return { ok: false, error: 'Could not save your check-in. Try again.' };
  }

  revalidate();
  return { ok: true };
}
