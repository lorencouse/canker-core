import { DEFAULT_AFTER_SIGN_IN } from '@/utils/auth-helpers/settings';

/**
 * Opening the native app on its working screen.
 *
 * The app's webview starts at the site's root, the marketing home page.
 * Sending it on from the client meant painting that page first and then
 * waiting for Today to render on the server, so every launch showed the home
 * page for seconds. The proxy can redirect before anything renders, but it
 * cannot tell the app's webview from a phone browser: the user agents differ
 * by platform and version, and changing them needs a new binary. So the app
 * says so itself, with a cookie NativeBridge sets on every launch. The
 * webview keeps its own cookie jar, apart from the phone's browser, so the
 * cookie never reaches a browser visit to the site.
 *
 * Functional only: a fixed value, nothing that tells one person from another.
 */
export const NATIVE_APP_COOKIE = 'native-app';

const ONE_YEAR = 60 * 60 * 24 * 365;

/** A `document.cookie` assignment that marks this webview as the app. */
export const nativeAppCookie = (secure: boolean): string =>
  `${NATIVE_APP_COOKIE}=1; path=/; max-age=${ONE_YEAR}; samesite=lax${secure ? '; secure' : ''}`;

export type LaunchRequest = {
  method: string;
  pathname: string;
  hasSession: boolean;
  isApp: boolean;
  header: (name: string) => string | null;
};

/**
 * Where an app launch should land instead of the home page, or null when
 * this request is not a launch.
 *
 * A launch is the webview's first document load of `/`: no referrer, since
 * nothing linked to it. Home tapped inside the app is either a client
 * navigation, a fetch, or a full load from another page, and both carry a
 * referrer, so both still reach the home page. (Next strips its own `rsc`
 * headers before the proxy sees them, so the referrer and Sec-Fetch-Dest are
 * what tell the two apart.) Signed out, the home page stays too; Today would
 * only bounce to sign-in.
 */
export function nativeLaunchTarget(req: LaunchRequest): string | null {
  if (req.method !== 'GET' || req.pathname !== '/') return null;
  if (!req.isApp || !req.hasSession) return null;
  if (req.header('referer')) return null;
  const dest = req.header('sec-fetch-dest');
  if (dest !== null && dest !== 'document') return null;
  return DEFAULT_AFTER_SIGN_IN;
}
