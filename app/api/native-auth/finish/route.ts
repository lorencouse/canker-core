/**
 * GET  /api/native-auth/finish?next=…&nonce=…[&error=…]
 * POST /api/native-auth/finish  (the confirmation form)
 *
 * The last pages the system sign-in (the iOS sheet or Android Custom Tab;
 * "the sheet" below) loads. Better Auth's provider
 * callback redirects to the GET once the sheet holds a session (or with
 * ?error= when the provider refused). The GET deletes that session at once,
 * holds its user as a five-minute pending handoff keyed by the flow cookie,
 * and asks "Continue to the Canker Core app as <email>?", so Safari is never
 * left signed in however the sheet is closed. Only the POST of that form,
 * from this origin and carrying a CSRF token bound to the flow cookie, spends
 * the pending handoff on a 60-second single-use handoff token and redirects
 * to the site's https callback, which only this app receives (a universal
 * link on iOS, a verified App Link on Android).
 *
 * Only a flow begun by /api/native-auth/start can get here usefully: the
 * nonce must match the httpOnly cookie start set in this same cookie jar, so
 * a link to this page from anywhere else mints nothing.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { safeNext } from '@/utils/auth-helpers/settings';
import {
  NATIVE_AUTH_FLOW_COOKIE,
  errorCode,
  isRandom32,
  nativeCallbackUrl
} from '@/utils/native-auth';
import {
  confirmToken,
  isConfirmToken,
  sameSecret
} from '@/utils/native-handoff';
import { CONFIRM_PAGE_HEADERS, confirmPage } from '@/utils/native-confirm';
import { clearCookie, forwardCookies, noStore, publicOrigin } from '../shared';

export const dynamic = 'force-dynamic';

type Result = Parameters<typeof nativeCallbackUrl>[0];

function done(request: NextRequest, result: Result, status: 302 | 303) {
  const url = nativeCallbackUrl(result, publicOrigin(request));
  const res = noStore(NextResponse.redirect(url, status));
  clearCookie(res, request, NATIVE_AUTH_FLOW_COOKIE);
  return res;
}

/** The flow cookie, when it matches the nonce this request carries. */
function flowFor(request: NextRequest, nonce: unknown): string | null {
  const flow = request.cookies.get(NATIVE_AUTH_FLOW_COOKIE)?.value;
  return isRandom32(nonce) && flow && sameSecret(flow, nonce) ? flow : null;
}

const forbidden = () => noStore(new NextResponse('Forbidden', { status: 403 }));

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const nonce = params.get('nonce');

  const flow = flowFor(request, nonce);
  if (!flow || !nonce) return done(request, { error: 'invalid_request' }, 302);

  // Better Auth appends ?error= to the error callback.
  const providerError = params.get('error');
  if (providerError) return done(request, { error: providerError }, 302);

  try {
    // No session (sessionMiddleware's 401) or a database failure throws.
    const { headers, response } = await auth.api.holdNativeHandoff({
      body: { flow },
      headers: request.headers,
      returnHeaders: true
    });
    const { secret } = await auth.$context;
    const html = confirmPage({
      email: response.email,
      nonce,
      next: safeNext(params.get('next')),
      csrf: confirmToken(secret, flow)
    });
    const res = noStore(new NextResponse(html, { status: 200 }));
    for (const [name, value] of Object.entries(CONFIRM_PAGE_HEADERS))
      res.headers.set(name, value);
    // Expires the sheet's session cookie, so Safari is not left signed in.
    forwardCookies(res, headers);
    return res;
  } catch (error) {
    // The error is logged without the request, which carries the cookies.
    console.error('native-auth finish failed', (error as Error)?.message);
    return done(request, { error: 'no_session' }, 302);
  }
}

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== publicOrigin(request))
    return forbidden();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return forbidden();
  }
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === 'string' ? value : null;
  };

  const nonce = field('nonce');
  const flow = flowFor(request, nonce);
  if (!flow || !nonce) return forbidden();
  const { secret } = await auth.$context;
  if (!isConfirmToken(secret, flow, field('csrf'))) return forbidden();

  try {
    if (field('action') !== 'continue') {
      await auth.api.discardNativeHandoff({ body: { flow } });
      return done(request, { error: 'cancelled' }, 303);
    }

    const { token } = await auth.api.mintNativeHandoff({ body: { flow } });
    return done(request, { token, next: safeNext(field('next')) }, 303);
  } catch (error) {
    // An expired or already-answered confirmation, or a database failure.
    const code = errorCode(
      (error as { body?: { message?: string } })?.body?.message
    );
    console.error('native-auth finish failed', code);
    return done(request, { error: code }, 303);
  }
}
