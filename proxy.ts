import { NextResponse, type NextRequest } from 'next/server';
import {
  FIRST_TOUCH_COOKIE,
  FIRST_TOUCH_MAX_AGE,
  encodeFirstTouch,
  externalReferrerHost
} from '@/utils/first-touch';

/**
 * Route protection.
 *
 * Supabase's middleware ran on every request purely to refresh the auth session
 * cookie. Better Auth manages its own cookie lifetime, so the proxy (Next 16's
 * name for middleware) does only a cheap optimistic check: presence of the
 * session cookie.
 *
 * This is deliberately *not* a validation: it only checks that the cookie is
 * present. Every protected page still resolves the real session server-side (via
 * getUser/getUserDetails) and redirects if it is missing or invalid, so a forged
 * cookie gains nothing beyond reaching a page that will bounce it.
 *
 * The cookie is read by name rather than with better-auth's `getSessionCookie`
 * helper, which pulls in `jose` for a check this simple — and this runs on
 * every matched request.
 *
 * It also sets the first-touch attribution cookie for signed-out visitors,
 * which is the only other thing that has to happen on the first request.
 */
const PROTECTED_PATHS = [
  '/today',
  '/my-sores',
  '/insights',
  '/profile',
  '/welcome',
  '/api/export'
];

// Better Auth adds the __Secure- prefix when the base URL is https.
const SESSION_COOKIES = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token'
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (!isProtected) {
    const response = NextResponse.next();
    if (
      !hasSession &&
      request.method === 'GET' &&
      !request.cookies.has(FIRST_TOUCH_COOKIE)
    ) {
      rememberFirstTouch(request, response);
    }
    return response;
  }

  if (!hasSession) {
    const signInUrl = new URL('/signin/password_signin', request.url);
    // So that signing in lands back here rather than on the map.
    signInUrl.searchParams.set('next', pathname + request.nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

/**
 * Notes where a signed-out visitor first arrived, so a signup can later be
 * credited to the article that brought it (utils/first-touch.ts). Setting a
 * cookie here leaves the static marketing pages static.
 */
function rememberFirstTouch(request: NextRequest, response: NextResponse) {
  const value = encodeFirstTouch({
    path: request.nextUrl.pathname,
    referrer: externalReferrerHost(
      request.headers.get('referer'),
      request.nextUrl.hostname
    ),
    at: new Date()
  });
  response.cookies.set(FIRST_TOUCH_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    // TLS ends at Traefik, so the request the app sees is plain http.
    secure: (
      request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol
    ).startsWith('https'),
    path: '/',
    maxAge: FIRST_TOUCH_MAX_AGE
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (auth endpoints must not be intercepted)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
