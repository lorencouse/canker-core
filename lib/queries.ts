/**
 * Data access — raw SQL over the shared pool.
 *
 * There is no row-level security: the app connects as one role, so **every
 * user-scoped query takes an explicit userId** and callers must pass the id
 * from the session, never from user input.
 *
 * React's `cache()` means a single render hits the DB once per distinct
 * argument.
 */
import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { query } from '@/lib/db/pool';
import { auth } from '@/lib/auth';
import type { DayLog, Sore, User } from '@/types';
import { isMouthView, zoneFor } from '@/utils/mouth-map/geometry';

/** The signed-in user, or null. */
export const getUser = cache(async (): Promise<User | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const u = session.user;
  return {
    id: u.id,
    email: u.email,
    full_name: u.name ?? null,
    avatar_url: u.image ?? null
  };
});

/**
 * Whether the first-run flow has been seen, read from the row rather than
 * from the session.
 *
 * The session is cookie-cached for five minutes, which is precisely the
 * window in which this changes: finishing onboarding and then being sent
 * back to it because the cookie had not caught up is the one failure this
 * flag exists to prevent. A primary-key lookup on a one-row-per-person
 * table, deduped per render by cache(), is the cheaper mistake.
 */
export const getOnboardedAt = cache(async (userId: string): Promise<string | null> => {
  const rows = await query<{ onboarded_at: string | null }>(
    `select to_jsonb("onboardedAt") #>> '{}' as onboarded_at
       from "user" where id = $1`,
    [userId]
  );
  return rows[0]?.onboarded_at ?? null;
});

/** Profile for the signed-in user; the profile lives on the auth record. */
export const getUserDetails = cache(async (): Promise<User | null> => getUser());

/**
 * Every sore belonging to a user, newest first, each with its readings
 * oldest first.
 *
 * Timestamps come back through jsonb so they arrive as ISO 8601 strings
 * rather than the pg driver's Date objects, which is the shape the client
 * components already expect and the only one Safari parses reliably.
 */
export const getSores = cache(async (userId: string): Promise<Sore[]> => {
  const rows = await query<Sore>(
    `select
       s.id, s.user_id, s.view, s.x, s.y, s.zone,
       to_jsonb(s.created_at) #>> '{}' as created_at,
       to_jsonb(s.healed_at)  #>> '{}' as healed_at,
       coalesce(
         (select jsonb_agg(
                   jsonb_build_object(
                     'id', r.id,
                     'recorded_at', r.recorded_at,
                     'size', r.size,
                     'pain', r.pain,
                     'note', r.note)
                   order by r.recorded_at)
            from readings r
           where r.sore_id = s.id),
         '[]'::jsonb
       ) as readings
     from sores s
     where s.user_id = $1
     order by s.created_at desc`,
    [userId]
  );
  // The zone is a function of position; recomputing on read means rows
  // carried over from the old diagram pick up correct labels for free.
  return rows.map((sore) => {
    const view = isMouthView(sore.view) ? sore.view : 'front';
    return {
      ...sore,
      view,
      zone: sore.x === null || sore.y === null ? sore.zone : zoneFor(view, sore.x, sore.y)
    };
  });
});

/** The user's daily logs, newest first. */
export const getDayLogs = cache(async (userId: string): Promise<DayLog[]> => {
  return query<DayLog>(
    `select to_char(day, 'YYYY-MM-DD') as day, triggers, treatments, note
     from day_logs
     where user_id = $1
     order by day desc`,
    [userId]
  );
});
