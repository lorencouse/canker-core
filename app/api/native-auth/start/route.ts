/**
 * GET /api/native-auth/start?provider=google|github&next=/today&nonce=…
 *
 * The first page the iOS system sign-in sheet loads. Begins Better Auth's
 * ordinary social sign-in here, server side, so its OAuth state cookie lands
 * in the sheet's cookie jar — the jar the provider callback will arrive in —
 * and sends the sheet on to the provider. The provider callback is still
 * Better Auth's /api/auth/callback/<provider>, so the OAuth apps need no new
 * redirect URI; only the final hop goes to /api/native-auth/finish.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { auth, configuredOAuthProviders } from '@/lib/auth';
import { safeNext } from '@/utils/auth-helpers/settings';
import {
  NATIVE_AUTH_COOKIE_PATH,
  NATIVE_AUTH_FLOW_COOKIE,
  NATIVE_AUTH_FLOW_MAX_AGE,
  isRandom32,
  nativeCallbackUrl,
  parseProvider
} from '@/utils/native-auth';
import { forwardCookies, isHttps, noStore } from '../shared';

export const dynamic = 'force-dynamic';

/** Closes the sheet with an error the app turns into a message. */
const fail = (error: string) =>
  noStore(NextResponse.redirect(nativeCallbackUrl({ error }), 302));

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
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
  return res;
}
