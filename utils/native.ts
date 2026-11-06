import { Capacitor, registerPlugin } from '@capacitor/core';
import { ImpactStyle } from '@capacitor/haptics';

/**
 * Thin wrappers over the Capacitor plugins.
 *
 * Every one of these is a no-op on the web, so callers never branch on the
 * platform: a component asks for a tap tick and either gets one or does not.
 */

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform();

/**
 * A short tick on a discrete choice — placing a sore, switching a view.
 * Deliberately not fired on scroll, drag, or slider movement: continuous
 * feedback reads as a stutter and drains the taptic engine.
 */
export async function tap(style: 'light' | 'medium' = 'light') {
  if (!isNative()) return;
  try {
    const { Haptics } = await import('@capacitor/haptics');
    await Haptics.impact({
      style: style === 'light' ? ImpactStyle.Light : ImpactStyle.Medium
    });
  } catch {
    // Haptics are a courtesy; a device without them must not break a tap.
  }
}

/** Confirmation of a committed change — finishing an edit, deleting a sore. */
export async function notify(type: 'success' | 'warning' | 'error') {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({
      type:
        type === 'success'
          ? NotificationType.Success
          : type === 'warning'
            ? NotificationType.Warning
            : NotificationType.Error
    });
  } catch {
    /* see above */
  }
}

/**
 * External links must leave the app webview. Opening one in place would
 * strand the user on github.com with no way back — there is no URL bar.
 */
export async function openExternal(url: string) {
  if (!isNative()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url, presentationStyle: 'popover' });
}

/**
 * The WebAuth plugin (native/plugins/web-auth): the system sign-in. On iOS
 * it is Apple's sign-in sheet, ASWebAuthenticationSession, which unlike the
 * Browser plugin's SFSafariViewController shares Safari's cookies, saved
 * passwords and passkeys. On Android it is a Chrome Custom Tab, which shares
 * Chrome's signed-in Google accounts and passkeys, and comes back through a
 * verified App Link. Either way, reaching the person's existing accounts is
 * the whole point of using it for sign-in.
 *
 * Registered by name rather than imported from the package: the site is
 * what runs in the webview, so it must not depend on a package that only
 * exists for the native build.
 */
interface WebAuthPlugin {
  capabilities(options: {
    callbackPath: string;
  }): Promise<{ httpsCallback: boolean }>;
  start(options: {
    url: string;
    callbackPath: string;
  }): Promise<{ url: string }>;
}

let webAuth: WebAuthPlugin | undefined;

// Synchronous on purpose: the plugin is a proxy that turns any property,
// `then` included, into a native call, so resolving a promise with it calls
// an unimplemented `WebAuth.then()` and the promise never settles.
const webAuthPlugin = () =>
  (webAuth ??= registerPlugin<WebAuthPlugin>('WebAuth'));

/**
 * True only where the system sign-in can return through the site's
 * `https://<server><callbackPath>` link, which only this app can receive:
 * the iOS app on iOS 17.4+, or the Android app with a Custom Tabs browser
 * and (on Android 12+, which can say) a verified App Link, both with an
 * https server. False on an app build without the plugin, which then keeps
 * OAuth in the webview. (The iOS plugin ignores callbackPath here.)
 */
export async function hasSystemSignIn(callbackPath: string): Promise<boolean> {
  if (!isNative() || !['ios', 'android'].includes(platform())) return false;
  try {
    const { httpsCallback } = await webAuthPlugin().capabilities({
      callbackPath
    });
    return httpsCallback === true;
  } catch {
    return false;
  }
}

/**
 * Opens `url` in the system sign-in and resolves with the
 * `https://<server><callbackPath>` URL it is redirected to. Rejects with code
 * 'CANCELED' when the person closes the sheet or the tab.
 */
export async function systemSignIn(url: string, callbackPath: string) {
  return webAuthPlugin().start({ url, callbackPath });
}
