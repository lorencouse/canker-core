/**
 * POST /api/native-auth/apple-grant  { code } -> { kept: boolean }
 *
 * Sent by the iOS app's webview right after its own Sign in with Apple sheet
 * has signed the person in (utils/auth-helpers/client.ts). The sheet's
 * authorization code is exchanged for a refresh token, which is what lets
 * deleting the account revoke the Apple grant (lib/apple.ts). Only the
 * signed-in user's own Apple subject is ever updated, so a code from anyone
 * else's sheet files nothing. Best effort: the sign-in has already happened.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { keepAppleGrant } from '@/lib/apple';
import { noStore } from '../shared';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user)
    return noStore(NextResponse.json({ kept: false }, { status: 401 }));
  let code: unknown;
  try {
    ({ code } = (await request.json()) as { code?: unknown });
  } catch {
    return noStore(NextResponse.json({ kept: false }, { status: 400 }));
  }
  const kept = await keepAppleGrant(session.user.id, code);
  return noStore(NextResponse.json({ kept }));
}
