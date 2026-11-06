/**
 * GET  /api/native-auth/finish?next=…&nonce=…&callback=https|scheme[&error=…]
 * POST /api/native-auth/finish  (the confirmation form)
 *
 * The last pages the iOS system sign-in sheet loads. Better Auth's provider
 * callback redirects to the GET once the sheet holds a session (or with
 * ?error= when the provider refused), and the GET asks "Continue to the
 * Canker Core app as <email>?". Only the POST of that form, from this
 * origin and carrying a CSRF token bound to the flow cookie, swaps the
 * session for a 60-second single-use handoff token, signs the sheet out, and
 * redirects to the app's callback, which the sheet captures and hands back.
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
  isRandom32,
  nativeCallbackUrl,
  parseCallbackKind,
  type NativeCallbackKind
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

function finisher(request: NextRequest, kind: NativeCallbackKind) {
  return (result: Result, status: 302 | 303) => {
    const url = nativeCallbackUrl(result, {
      kind,
      origin: publicOrigin(request)
    });
    const res = noStore(NextResponse.redirect(url, status));
    clearCookie(res, request, NATIVE_AUTH_FLOW_COOKIE);
    return res;
  };
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
  const kind = parseCallbackKind(params.get('callback'));
  const done = finisher(request, kind);

  const flow = flowFor(request, nonce);
  if (!flow || !nonce) return done({ error: 'invalid_request' }, 302);

  // Better Auth appends ?error= to the error callback.
  const providerError = params.get('error');
  if (providerError) return done({ error: providerError }, 302);

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return done({ error: 'no_session' }, 302);
    const { secret } = await auth.$context;
    const html = confirmPage({
      email: session.user.email,
      nonce,
      next: safeNext(params.get('next')),
      callback: kind,
      csrf: confirmToken(secret, flow)
    });
    return noStore(
      new NextResponse(html, { status: 200, headers: CONFIRM_PAGE_HEADERS })
    );
  } catch (error) {
    // The error is logged without the request, which carries the cookies.
    console.error('native-auth finish failed', (error as Error)?.message);
    return done({ error: 'no_session' }, 302);
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

  const done = finisher(request, parseCallbackKind(field('callback')));

  try {
    if (field('action') !== 'continue') {
      const { headers } = await auth.api.signOut({
        headers: request.headers,
        returnHeaders: true
      });
      const res = done({ error: 'cancelled' }, 303);
      forwardCookies(res, headers);
      return res;
    }

    const { headers, response } = await auth.api.mintNativeHandoff({
      body: { nonce },
      headers: request.headers,
      returnHeaders: true
    });
    const res = done(
      { token: response.token, next: safeNext(field('next')) },
      303
    );
    // Expires the sheet's session cookie, so Safari is not left signed in.
    forwardCookies(res, headers);
    return res;
  } catch (error) {
    // No session (sessionMiddleware's 401) or a database failure.
    console.error('native-auth finish failed', (error as Error)?.message);
    return done({ error: 'no_session' }, 303);
  }
}
