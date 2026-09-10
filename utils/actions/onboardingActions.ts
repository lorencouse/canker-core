'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { query } from '@/lib/db/pool';
import type { ActionResult } from '@/utils/actions/soreActions';

/**
 * Marking the first-run flow as seen.
 *
 * One write, and it is idempotent: finishing and skipping are the same fact
 * as far as the app is concerned — this person has been introduced to it —
 * and the `is null` guard means a second call cannot move the timestamp.
 */
export async function completeOnboarding(): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return {
      ok: false,
      error: 'Your session has expired. Sign in again to continue.'
    };
  }

  try {
    await query(
      `update "user" set "onboardedAt" = now()
        where id = $1 and "onboardedAt" is null`,
      [userId]
    );
  } catch {
    return { ok: false, error: 'Could not save that. Try again.' };
  }

  // The app shell reads this flag on every signed-in render, so the cached
  // shells have to be dropped or the next navigation bounces back here.
  revalidatePath('/', 'layout');
  return { ok: true };
}
