import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

/**
 * Shared by the server-action modules. It lives outside the `'use server'`
 * files because everything those export becomes a callable endpoint.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

export const NOT_SIGNED_IN: ActionResult = {
  ok: false,
  error: 'Your session has expired. Sign in again to save.'
};

export async function requireUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}
