'use server';

import { revalidatePath } from 'next/cache';

import { pool, transaction } from '@/lib/db/pool';
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
import { DAY_LOG_COLUMNS, isDayKey } from '@/utils/day-log';

/** Partial day saves and check-in status; ownership rules as in `soreActions`. */

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
  if (!isDayKey(day)) return BAD_DAY;
  const valid = validatePatch(patch);
  if (!valid) return { ok: false, error: 'That answer could not be saved.' };

  try {
    await transaction(async (client) => {
      // `for update` locks nothing when the row is missing, so two first saves can
      // race; `on conflict` below turns the loser into an update instead of an error.
      const { rows } = await client.query<DayLog>(
        `select ${DAY_LOG_COLUMNS}
           from day_logs where user_id = $1 and day = $2 for update`,
        [userId, day]
      );
      const next = applyPatch(rows[0] ?? null, day, valid);
      if (isBlankDayLog(next)) {
        await client.query(
          'delete from day_logs where user_id = $1 and day = $2',
          [userId, day]
        );
        return;
      }
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
    });
  } catch (error) {
    console.error('Error saving day patch:', error);
    return { ok: false, error: 'Could not save that answer. Try again.' };
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
  if (!isDayKey(day)) return BAD_DAY;
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
