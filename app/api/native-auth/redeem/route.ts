/**
 * GET /api/native-auth/redeem?token=…&next=…
 *
 * Loaded by the app's webview after the system sign-in (the iOS sheet, or
 * the Android Custom Tab through its App Link) hands back
 * its callback. Spends the handoff token — which must be unexpired, unused,
 * and minted for the nonce in this webview's own cookie — and signs the
 * webview in with a new session, then goes on to `next`. Every failure lands
 * on the sign-in page with a message.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { safeNext } from '@/utils/auth-helpers/settings';
import { getErrorRedirect } from '@/utils/helpers';
import {
  NATIVE_AUTH_NONCE_COOKIE,
  errorCode,
  nativeAuthErrorMessage
} from '@/utils/native-auth';
import { clearCookie, forwardCookies, noStore, publicOrigin } from '../shared';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const token = params.get('token') ?? '';
  const nonce = request.cookies.get(NATIVE_AUTH_NONCE_COOKIE)?.value ?? '';

  const redirect = (path: string) => {
    // Resolved against the public origin, not request.url: the standalone
    // server binds 0.0.0.0:3000, and request.url carries that, so the
    // webview was sent to https://0.0.0.0:3000 after signing in.
    // safeNext only ever yields a same-origin path; checking the origin is
    // the backstop for that promise.
    const origin = publicOrigin(request);
    const target = new URL(path, origin);
    if (target.origin !== origin) target.href = new URL('/today', origin).href;
    const res = noStore(NextResponse.redirect(target, 303));
    clearCookie(res, request, NATIVE_AUTH_NONCE_COOKIE);
    return res;
  };

  try {
    const { headers } = await auth.api.redeemNativeHandoff({
      body: { token, nonce },
      headers: request.headers,
      returnHeaders: true
    });
    const res = redirect(safeNext(params.get('next')));
    forwardCookies(res, headers);
    return res;
  } catch (error) {
    const code = errorCode(
      (error as { body?: { message?: string } })?.body?.message
    );
    console.error('native-auth redeem failed', code);
    return redirect(
      getErrorRedirect(
        '/signin/password_signin',
        'Sign in failed.',
        nativeAuthErrorMessage(code)
      )
    );
  }
}
