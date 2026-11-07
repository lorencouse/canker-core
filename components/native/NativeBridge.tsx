'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { useTheme } from 'next-themes';

import { releaseAutoStart } from '@/utils/check-in/auto-start-hold';
import { isNative } from '@/utils/native';
import { syncReminders } from '@/utils/reminders';

/**
 * Wires the web app to the native shell.
 *
 * Mounted once at the root. Renders nothing; every effect is guarded so the
 * component is inert in a browser, which means the app is developed and
 * tested on the web without a second code path.
 *
 * The four things a webview gets wrong by default, in order of how badly
 * they break the illusion (plus the daily reminder, which only exists here):
 *   1. A status bar whose text stays dark when the app goes dark.
 *   2. Android's back button closing the whole app from any screen.
 *   3. A soft keyboard that covers whatever you were typing into.
 *   4. A splash screen that hides before the first paint, flashing white.
 */
export default function NativeBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  /* --- status bar follows the theme ------------------------------------- */
  // Read through a ref so applying the bar is not tied to the render that
  // changed the theme: the splash screen needs to re-apply it later, long
  // after this effect last ran.
  const themeRef = useRef(resolvedTheme);

  const applyStatusBar = useCallback(async () => {
    const theme = themeRef.current;
    if (!isNative() || !theme) return;

    const { StatusBar, Style } = await import('@capacitor/status-bar');
    // Overlay first, then style, and never the other way round. The bar
    // overlays the webview so the page paints under it and the safe-area
    // padding is what keeps content clear — but on Android that is set with
    // the old setSystemUiVisibility flags, which reset the glyph appearance
    // that setStyle asks WindowInsetsController for. Styling first leaves a
    // light app with white-on-white glyphs.
    await StatusBar.setOverlaysWebView({ overlay: true });
    // Style names the *content*: Light means dark glyphs, for a light app.
    await StatusBar.setStyle({
      style: theme === 'dark' ? Style.Dark : Style.Light
    });
  }, []);

  useEffect(() => {
    themeRef.current = resolvedTheme;
    void applyStatusBar();
  }, [resolvedTheme, applyStatusBar]);

  /* --- hardware back button --------------------------------------------- */
  useEffect(() => {
    if (!isNative() || !Capacitor.isPluginAvailable('App')) return;
    let remove: (() => void) | undefined;
    let gone = false;

    (async () => {
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('backButton', ({ canGoBack }) => {
        // Only the true root exits. Anywhere else, back means back — matching
        // what the button does in every other Android app.
        if (canGoBack && window.history.length > 1) {
          router.back();
        } else {
          App.exitApp();
        }
      });
      if (gone) handle.remove();
      else remove = () => handle.remove();
    })().catch((error) => console.error('back button listener failed', error));

    return () => {
      gone = true;
      remove?.();
    };
  }, [router]);

  /* --- foreground ----------------------------------------------------------- */
  // Coming back to the foreground is an open: let the check-in auto-start
  // again. App-level so it works wherever the app was left, not only Today.
  useEffect(() => {
    if (!isNative() || !Capacitor.isPluginAvailable('App')) return;
    let remove: (() => void) | undefined;
    let gone = false;

    (async () => {
      const { App } = await import('@capacitor/app');
      const handle = await App.addListener('resume', releaseAutoStart);
      if (gone) handle.remove();
      else remove = () => handle.remove();
    })().catch((error) => console.error('resume listener failed', error));

    return () => {
      gone = true;
      remove?.();
    };
  }, []);

  /* --- soft keyboard ----------------------------------------------------- */
  useEffect(() => {
    if (!isNative()) return;
    const removers: Array<() => void> = [];

    (async () => {
      if (!Capacitor.isPluginAvailable('Keyboard')) return;
      const { Keyboard } = await import('@capacitor/keyboard');
      // On Android, Capacitor 8's SystemBars plugin pads the app window by
      // the keyboard's height whenever it shows, and no setting turns that
      // off without also dropping its status and navigation bar handling.
      // The webview has already shrunk there, so a --keyboard-h lift on top
      // would lift twice; it stays 0px and only iOS publishes it.
      const liftByVariable = Capacitor.getPlatform() !== 'android';
      const show = await Keyboard.addListener('keyboardWillShow', (info) => {
        // Published as a variable rather than resizing the webview: the
        // fixed chrome is positioned against the viewport, and resizing it
        // makes the tab bar jump into the middle of the screen.
        if (liftByVariable) {
          document.documentElement.style.setProperty(
            '--keyboard-h',
            `${info.keyboardHeight}px`
          );
        }
        document.documentElement.dataset.keyboard = 'open';
      });
      const hide = await Keyboard.addListener('keyboardWillHide', () => {
        document.documentElement.style.setProperty('--keyboard-h', '0px');
        delete document.documentElement.dataset.keyboard;
      });
      removers.push(
        () => show.remove(),
        () => hide.remove()
      );
    })().catch((error) => console.error('keyboard listener failed', error));

    return () => removers.forEach((fn) => fn());
  }, []);

  /* --- splash screen ------------------------------------------------------ */
  // Fade length, shared by the hide call and the wait that follows it.
  const FADE_MS = 200;
  // Must match plugins.SplashScreen.launchShowDuration in capacitor.config.ts.
  // The splash also times out on its own — the backstop for the offline
  // shell, which has no bridge to dismiss it with — and that timeout tears
  // the splash window down whether or not the app already hid it, taking the
  // status bar appearance with it. So the bar is asserted once more after the
  // timeout can no longer fire.
  const LAUNCH_SHOW_MS = 5000;

  useEffect(() => {
    if (!isNative()) return;
    const timers: number[] = [];
    // The splash covers hydration rather than uncovering a half-built page,
    // so hide it here instead of letting it time out. Two frames is enough
    // for the first paint. (It does also auto-hide, but only as the backstop
    // for the offline shell, which cannot reach this code — see
    // capacitor.config.ts.)
    const id = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(async () => {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide({ fadeOutDuration: FADE_MS });
        // Tearing the splash window down restores the flags it was shown
        // with, dropping the status bar back to its cold-start style — so on
        // a cold start the theme has to be asserted a second time. hide()
        // resolves when the fade is asked for, not when it ends, hence the
        // wait: re-styling mid-fade is what gets undone.
        timers.push(
          window.setTimeout(() => void applyStatusBar(), FADE_MS + 100),
          window.setTimeout(() => void applyStatusBar(), LAUNCH_SHOW_MS + 150)
        );
      })
    );
    return () => {
      window.cancelAnimationFrame(id);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [applyStatusBar]);

  /* --- daily reminder ------------------------------------------------------ */
  useEffect(() => {
    if (!isNative() || !Capacitor.isPluginAvailable('LocalNotifications'))
      return;
    let remove: (() => void) | undefined;
    let gone = false;

    // Re-assert the schedule on launch (an OS update or a reinstall can drop
    // it) and open the check-in when the notification is tapped.
    syncReminders().catch((error) =>
      console.error('reminder sync failed', error)
    );
    (async () => {
      const { LocalNotifications } = await import(
        '@capacitor/local-notifications'
      );
      const handle = await LocalNotifications.addListener(
        'localNotificationActionPerformed',
        ({ notification }) => {
          const path = (notification.extra as { path?: string } | undefined)
            ?.path;
          if (path) router.push(path);
        }
      );
      if (gone) handle.remove();
      else remove = () => handle.remove();
    })().catch((error) => console.error('notification listener failed', error));

    return () => {
      gone = true;
      remove?.();
    };
  }, [router]);

  /* --- scroll restoration ------------------------------------------------- */
  useEffect(() => {
    // A webview keeps the scroll offset across a client-side navigation, so
    // a new screen can open halfway down. Native apps always open at the top.
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
