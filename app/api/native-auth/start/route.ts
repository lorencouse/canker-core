/**
 * GET /api/native-auth/start?provider=google|github&next=/today&nonce=…
 *     [&ft=…]
 *
 * The first page the iOS system sign-in sheet loads. Begins Better Auth's
 * ordinary social sign-in here, server side, so its OAuth state cookie lands
 * in the sheet's cookie jar — the jar the provider callback will arrive in —
 * and sends the sheet on to the provider. The provider callback is still
 * Better Auth's /api/auth/callback/<provider>, so the OAuth apps need no new
 * redirect URI; only the final hop goes to /api/native-auth/finish.
 *
 * `ft` is the webview's first-touch cookie (utils/first-touch.ts). The
 * account is created by the provider callback in the sheet's jar, so start
 * sets the same cookie there for the signup hook in lib/auth.ts to find.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { auth, configuredOAuthProviders } from '@/lib/auth';
import { safeNext } from '@/utils/auth-helpers/settings';
import {
  FIRST_TOUCH_COOKIE,
  FIRST_TOUCH_MAX_AGE,
  decodeFirstTouch,
  encodeFirstTouch
} from '@/utils/first-touch';
import {
  NATIVE_AUTH_COOKIE_PATH,
  NATIVE_AUTH_FLOW_COOKIE,
  NATIVE_AUTH_FLOW_MAX_AGE,
  isRandom32,
  nativeCallbackUrl,
  parseProvider
} from '@/utils/native-auth';
import { forwardCookies, isHttps, noStore, publicOrigin } from '../shared';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  /** Closes the sheet with an error the app turns into a message. */
  const fail = (error: string) =>
    noStore(
      NextResponse.redirect(
        nativeCallbackUrl({ error }, publicOrigin(request)),
        302
      )
    );
  const provider = parseProvider(params.get('provider'));
  const nonce = params.get('nonce');
  if (!provider || !configuredOAuthProviders().includes(provider))
    return fail('invalid_provider');
  if (!isRandom32(nonce)) return fail('invalid_request');
  const next = safeNext(params.get('next'));

  // Relative, so Better Auth's origin check accepts it, and stored by Better
  // Auth with the OAuth state, so nobody can swap it mid-flight.
  const finish = `/api/native-auth/finish?${new URLSearchParams({ next, nonce })}`;

  let url: string;
  let headers: Headers | null = null;
  try {
    const result = await auth.api.signInSocial({
      body: {
        provider,
        callbackURL: finish,
        errorCallbackURL: finish,
        disableRedirect: true
      },
      headers: request.headers,
      returnHeaders: true
    });
    headers = result.headers;
    if (!result.response?.url) return fail('server_error');
    url = result.response.url;
  } catch (error) {
    console.error('native-auth start failed', provider, error);
    return fail('server_error');
  }

  const res = noStore(NextResponse.redirect(url, 302));
  forwardCookies(res, headers);
  res.cookies.set(NATIVE_AUTH_FLOW_COOKIE, nonce, {
    path: NATIVE_AUTH_COOKIE_PATH,
    maxAge: NATIVE_AUTH_FLOW_MAX_AGE,
    httpOnly: true,
    secure: isHttps(request),
    // Lax: the provider's callback chain is a cross-site top-level GET.
    sameSite: 'lax'
  });
  // Validated as strictly as the cookie itself, and written as proxy.ts does.
  const touch = decodeFirstTouch(params.get('ft'));
  if (touch) {
    res.cookies.set(FIRST_TOUCH_COOKIE, encodeFirstTouch(touch), {
      path: '/',
      maxAge: FIRST_TOUCH_MAX_AGE,
      httpOnly: true,
      secure: isHttps(request),
      sameSite: 'lax'
    });
  }
  return res;
}
