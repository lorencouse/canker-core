/**
 * Response plumbing shared by the native sign-in routes. The rules
 * (validation, tokens) are in utils/native-auth.ts and utils/native-handoff.ts.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { NATIVE_AUTH_COOKIE_PATH } from '@/utils/native-auth';

/** Every response here carries a one-off value; none may be cached. */
export function noStore<T extends NextResponse>(res: T): T {
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}

/** TLS ends at Traefik, so the request the app sees is plain http. */
export function isHttps(request: NextRequest): boolean {
  return (
    request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol
  ).startsWith('https');
}

/** The origin the browser sees: Traefik keeps the Host header. */
export function publicOrigin(request: NextRequest): string {
  const host = request.headers.get('host') ?? request.nextUrl.host;
  return `${isHttps(request) ? 'https' : 'http'}://${host}`;
}

export function clearCookie(
  res: NextResponse,
  request: NextRequest,
  name: string
) {
  res.cookies.set(name, '', {
    path: NATIVE_AUTH_COOKIE_PATH,
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: isHttps(request),
    sameSite: 'lax'
  });
}

/**
 * Copies the Set-Cookie headers Better Auth returned onto our response.
 * Better Auth's nextCookies plugin writes them through next/headers too;
 * a cookie already present on the response is not added twice.
 */
export function forwardCookies(res: NextResponse, headers: Headers | null) {
  if (!headers) return;
  const existing = new Set(res.headers.getSetCookie());
  for (const cookie of headers.getSetCookie()) {
    if (!existing.has(cookie)) res.headers.append('Set-Cookie', cookie);
  }
}
