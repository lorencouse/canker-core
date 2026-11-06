/**
 * The iOS system sign-in handoff, the parts both sides share.
 *
 * On iOS 17.4+, OAuth runs in Apple's system sign-in sheet
 * (ASWebAuthenticationSession) rather than in the app's webview, so it can use the accounts, passwords and
 * passkeys the person already has in Safari. The sheet and the webview keep
 * separate cookie jars, so the session the sheet ends up with has to be handed
 * across:
 *
 *   webview  sets a random nonce cookie, opens the sheet at
 *            /api/native-auth/start?provider&next&nonce
 *   sheet    start -> provider -> Better Auth's normal callback -> finish
 *   finish   deletes the sheet's session at once, holds its user as a
 *            pending handoff (five minutes, keyed by the flow cookie) and
 *            asks "Continue to the Canker Core app as <email>?"; only the
 *            same-origin POST of that page, carrying a CSRF token bound to
 *            the flow cookie, spends the pending handoff on a 60-second,
 *            single-use handoff token and redirects to
 *            https://<site>/native-auth/callback?token&next, a universal
 *            link iOS hands only to this app. There is no custom-scheme
 *            callback: any app can claim a scheme. Older iOS, which cannot
 *            catch an https callback, keeps OAuth in the webview.
 *   webview  the sheet hands that URL back; the webview loads
 *            /api/native-auth/redeem?token&next, which needs the nonce cookie
 *            from the first step and sets a fresh session cookie
 *
 * Nothing here touches Node APIs, so the client and the route handlers import
 * the same rules. Token minting and redemption are in utils/native-handoff.ts.
 */

export type NativeOAuthProvider = 'google' | 'github';

const PROVIDERS: readonly NativeOAuthProvider[] = ['google', 'github'];

/** The universal-link callback. iOS hands it only to an app the site's
 * apple-app-site-association names, so another app cannot receive the token.
 * The page behind it (app/native-auth/callback) never reads the token. */
export const NATIVE_AUTH_HTTPS_PATH = '/native-auth/callback';

/** Set in the sheet by start, required by finish: only a flow this server
 * began can mint a token. */
export const NATIVE_AUTH_FLOW_COOKIE = 'native_auth_flow';
/** Set in the webview by the client, required by redeem: only the webview
 * that began the flow can redeem its token. */
export const NATIVE_AUTH_NONCE_COOKIE = 'native_auth_nonce';
export const NATIVE_AUTH_COOKIE_PATH = '/api/native-auth';
/** Long enough to type a password and approve a passkey. */
export const NATIVE_AUTH_FLOW_MAX_AGE = 60 * 10;

/** 32 random bytes in base64url, with no padding: 43 characters. */
const RANDOM_32 = /^[A-Za-z0-9_-]{43}$/;

export function parseProvider(raw: unknown): NativeOAuthProvider | null {
  return PROVIDERS.find((p) => p === raw) ?? null;
}

/** Nonces and handoff tokens are both 256-bit random values. */
export function isRandom32(raw: unknown): raw is string {
  return typeof raw === 'string' && RANDOM_32.test(raw);
}

/** Error codes travel through URLs and into the UI; anything odd is flattened. */
export function errorCode(raw: unknown): string {
  return typeof raw === 'string' && /^[a-z0-9_]{1,64}$/i.test(raw)
    ? raw.toLowerCase()
    : 'unknown';
}

/** Where the sheet is sent at the end: the https callback on `origin`. */
export function nativeCallbackUrl(
  result: { token: string; next: string } | { error: string },
  origin: string
): string {
  const params = new URLSearchParams(
    'error' in result
      ? { error: errorCode(result.error) }
      : { token: result.token, next: result.next }
  );
  return `${new URL(NATIVE_AUTH_HTTPS_PATH, origin).href}?${params}`;
}

/** What the sheet handed back, or null when it is not our callback at all.
 * `origin` is the site's, the only host an https callback may be on. */
export function parseNativeCallback(
  raw: string,
  origin: string
): { token: string; next: string } | { error: string } | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (
    url.protocol !== 'https:' ||
    url.origin !== origin ||
    url.pathname !== NATIVE_AUTH_HTTPS_PATH
  )
    return null;
  const error = url.searchParams.get('error');
  if (error) return { error: errorCode(error) };
  const token = url.searchParams.get('token');
  if (!isRandom32(token)) return { error: 'invalid_token' };
  return { token, next: url.searchParams.get('next') ?? '' };
}

/** A fresh 256-bit nonce, base64url. Browser and Node both have Web Crypto. */
export function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** User-facing copy for each way the handoff can fail. */
export function nativeAuthErrorMessage(code: string): string {
  switch (code) {
    case 'expired_token':
    case 'invalid_token':
    case 'wrong_device':
      return 'That sign-in did not complete in time. Please try again.';
    case 'access_denied':
      return 'Sign-in was cancelled at the provider.';
    default:
      return 'Something went wrong signing you in. Please try again.';
  }
}
