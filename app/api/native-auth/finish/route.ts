/**
 * GET /api/native-auth/finish?next=…&nonce=…[&error=…]
 *
 * The last page the iOS system sign-in sheet loads: Better Auth's provider
 * callback redirects here once the sheet holds a session (or with ?error=
 * when the provider refused). Swaps that session for a 60-second single-use
 * handoff token, signs the sheet out, and redirects to the app's callback
 * scheme, which the sheet captures and hands back to the app.
 *
 * Only a flow begun by /api/native-auth/start can get here usefully: the
 * nonce in the URL must match the httpOnly cookie start set in this same
 * cookie jar, so a link to this page from anywhere else mints nothing.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { safeNext } from '@/utils/auth-helpers/settings';
import {
  NATIVE_AUTH_FLOW_COOKIE,
  isRandom32,
  nativeCallbackUrl
} from '@/utils/native-auth';
import { sameSecret } from '@/utils/native-handoff';
import { clearCookie, forwardCookies, noStore } from '../shared';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const nonce = params.get('nonce');
  const flow = request.cookies.get(NATIVE_AUTH_FLOW_COOKIE)?.value;

  const done = (result: Parameters<typeof nativeCallbackUrl>[0]) => {
    const res = noStore(NextResponse.redirect(nativeCallbackUrl(result), 302));
    clearCookie(res, request, NATIVE_AUTH_FLOW_COOKIE);
    return res;
  };

  if (!isRandom32(nonce) || !flow || !sameSecret(flow, nonce))
    return done({ error: 'invalid_request' });

  // Better Auth appends ?error= to the error callback.
  const providerError = params.get('error');
  if (providerError) return done({ error: providerError });

  try {
    const { headers, response } = await auth.api.mintNativeHandoff({
      body: { nonce },
      headers: request.headers,
      returnHeaders: true
    });
    const res = done({
      token: response.token,
      next: safeNext(params.get('next'))
    });
    // Expires the sheet's session cookie, so Safari is not left signed in.
    forwardCookies(res, headers);
    return res;
  } catch (error) {
    // No session (sessionMiddleware's 401) or a database failure. The
    // error is logged without the request, which carries the cookies.
    console.error('native-auth finish failed', (error as Error)?.message);
    return done({ error: 'no_session' });
  }
}
