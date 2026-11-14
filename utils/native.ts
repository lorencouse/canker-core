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

/**
 * The detent tick of a picker wheel, for controls that step through values
 * under a finger: the width ruler and the pain slider tick once per step
 * they cross. Where `tap` would stutter on a drag, a selection tick is the
 * lighter one the system wheels use.
 */
export async function selectionTick() {
  if (!isNative()) return;
  try {
    const { Haptics } = await import('@capacitor/haptics');
    // Android needs a selection started before a change ticks; iOS ignores it.
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
  } catch {
    /* see tap */
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
  /** iOS only, from build 111: Apple's own Sign in with Apple sheet. */
  apple(options: { nonce: string }): Promise<AppleSheetResult>;
}

export type AppleSheetResult = {
  /** Signed by Apple, its audience the app's bundle id. */
  idToken: string;
  /** Single-use, five minutes: traded server side for a refresh token. */
  authorizationCode?: string;
  /** Apple gives the name on the first authorization only. */
  givenName?: string;
  familyName?: string;
};

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

/**
 * Apple's native Sign in with Apple sheet, on the iOS app. Resolves null
 * where there is none (the web, Android, or an iOS binary built before the
 * sheet was added, whose plugin answers UNIMPLEMENTED), so the caller runs
 * Apple's web flow instead. Rejects with code 'CANCELED' when the person
 * closes the sheet, and 'FAILED' otherwise.
 */
export async function appleSheet(
  nonce: string
): Promise<AppleSheetResult | null> {
  if (!isNative() || platform() !== 'ios') return null;
  try {
    return await webAuthPlugin().apple({ nonce });
  } catch (err) {
    if ((err as { code?: string })?.code === 'UNIMPLEMENTED') return null;
    throw err;
  }
}

/**
 * A plugin's native side is present in this app binary.
 *
 * The apps are a shell around the hosted site (docs/MOBILE.md), so the site
 * can call a plugin an older binary was built without. On the web the plugin
 * packages register a browser stand-in, which makes `isPluginAvailable` true
 * there too, so the native check comes first.
 */
export const hasNativePlugin = (name: string): boolean =>
  isNative() && Capacitor.isPluginAvailable(name);

export type ActionOption = {
  title: string;
  style?: 'default' | 'destructive';
};

/**
 * The system action sheet, when this binary has it. Resolves with the picked
 * option's index, null when cancelled, or 'unavailable' when the caller has
 * to draw its own (the web, or an app built before the plugin was added).
 */
export async function nativeActionSheet(
  title: string,
  options: ActionOption[],
  message?: string
): Promise<number | null | 'unavailable'> {
  if (!hasNativePlugin('ActionSheet')) return 'unavailable';
  try {
    const { ActionSheet, ActionSheetButtonStyle } = await import(
      '@capacitor/action-sheet'
    );
    const { index, canceled } = await ActionSheet.showActions({
      title,
      message,
      options: [
        ...options.map((o) => ({
          title: o.title,
          style:
            o.style === 'destructive'
              ? ActionSheetButtonStyle.Destructive
              : ActionSheetButtonStyle.Default
        })),
        { title: 'Cancel', style: ActionSheetButtonStyle.Cancel }
      ]
    });
    return canceled || index < 0 || index >= options.length ? null : index;
  } catch {
    return 'unavailable';
  }
}

/**
 * Hands a text file to the system share sheet (Mail, Files, AirDrop, a
 * messaging app). Resolves false when this binary has no Share or
 * Filesystem plugin, so the caller falls back to a download; true once the
 * sheet has been shown, whether or not the person sent it anywhere.
 */
export async function shareTextFile(
  fileName: string,
  text: string,
  title: string
): Promise<boolean> {
  if (!hasNativePlugin('Share') || !hasNativePlugin('Filesystem')) return false;
  try {
    const { Directory, Encoding, Filesystem } = await import(
      '@capacitor/filesystem'
    );
    const { Share } = await import('@capacitor/share');
    // The cache folder, so the copy never lands in a backup and the system
    // can clear it.
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8
    });
    try {
      await Share.share({ title, files: [uri] });
    } catch (error) {
      // Closing the sheet rejects; that is an answer, not a failure.
      if (!(error instanceof Error && /cancel/i.test(error.message))) throw error;
    }
    return true;
  } catch {
    return false;
  }
}
