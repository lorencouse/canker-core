/**
 * Data access — raw SQL over the shared pool.
 *
 * Replaces utils/supabase/queries.ts. Two behavioural notes carried over from
 * the Supabase version:
 *
 *   - Supabase enforced per-user access with RLS, so callers could select from
 *     `sores` unscoped and the database filtered rows. There is
 *     no RLS here, so **every user-scoped query takes an explicit userId** and
 *     callers must pass the id from the session, never from user input.
 *   - React's `cache()` is kept so a single render still hits the DB once per
 *     distinct argument.
 */
import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { query, queryOne } from '@/lib/db/pool';
import { auth } from '@/lib/auth';
import type { Sore, User } from '@/types';
import { isMouthView, zoneFor } from '@/utils/mouth-map/geometry';

/** The signed-in user, or null. Replaces `supabase.auth.getUser()`. */
export const getUser = cache(async (): Promise<User | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const u = session.user;
  return {
    id: u.id,
    email: u.email,
    full_name: u.name ?? null,
    avatar_url: u.image ?? null,
    username: (u as { username?: string | null }).username ?? null,
    bio: (u as { bio?: string | null }).bio ?? null
  };
});

/**
 * Profile for the signed-in user.
 *
 * Previously a `select * from users` that RLS narrowed to the caller's own row.
 * The profile now lives on the auth user record, so this is the session lookup.
 */
export const getUserDetails = cache(async (): Promise<User | null> => getUser());

/** Every sore belonging to a user. */
export const getSores = cache(async (userId: string): Promise<Sore[]> => {
  const rows = await query<Sore>(
    `select id, user_id, zone, view, x, y, dates, pain, size, healed
     from sores
     where user_id = $1
     order by dates[1] desc nulls last`,
    [userId]
  );
  // The zone is a function of position; recomputing on read means rows
  // carried over from the old diagram pick up correct labels for free.
  return rows.map((sore) => ({
    ...sore,
    view: isMouthView(sore.view) ? sore.view : 'front',
    zone:
      sore.x === null || sore.y === null
        ? sore.zone
        : zoneFor(isMouthView(sore.view) ? sore.view : 'front', sore.x, sore.y)
  }));
});

