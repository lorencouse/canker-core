import { Capacitor } from '@capacitor/core';
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
 * The WebAuth plugin (native/plugins/web-auth): Apple's system sign-in sheet,
 * ASWebAuthenticationSession. Unlike the Browser plugin's
 * SFSafariViewController, it shares Safari's cookies, saved passwords and
 * passkeys, which is the whole point of using it for sign-in.
 *
 * Registered by name rather than imported from the package: the site is
 * what runs in the webview, so it must not depend on a package that only
 * exists for the native build.
 */
interface WebAuthPlugin {
  start(options: {
    url: string;
    callbackScheme: string;
  }): Promise<{ url: string }>;
}

let webAuth: WebAuthPlugin | undefined;

/** True only where the system sheet exists: the iOS app. */
export const hasSystemSignIn = () => isNative() && platform() === 'ios';

/**
 * Opens `url` in the system sign-in sheet and resolves with the callback URL
 * it is redirected to. Rejects with code 'CANCELED' when the person closes
 * the sheet, and with 'UNAVAILABLE' anywhere but iOS.
 */
export async function systemSignIn(url: string, callbackScheme: string) {
  if (!hasSystemSignIn()) {
    throw Object.assign(new Error('System sign-in is unavailable here.'), {
      code: 'UNAVAILABLE'
    });
  }
  const { registerPlugin } = await import('@capacitor/core');
  webAuth ??= registerPlugin<WebAuthPlugin>('WebAuth');
  return webAuth.start({ url, callbackScheme });
}
