'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

import { isNative } from '@/utils/native';

/**
 * Wires the web app to the native shell.
 *
 * Mounted once at the root. Renders nothing; every effect is guarded so the
 * component is inert in a browser, which means the app is developed and
 * tested on the web without a second code path.
 *
 * The four things a webview gets wrong by default, in order of how badly
 * they break the illusion:
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
  useEffect(() => {
    if (!isNative() || !resolvedTheme) return;
    let cancelled = false;

    (async () => {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      if (cancelled) return;
      // Style names the *content*: Dark means dark glyphs, for a light app.
      await StatusBar.setStyle({
        style: resolvedTheme === 'dark' ? Style.Dark : Style.Light
      });
      // The bar overlays the webview, so the page paints under it and the
      // safe-area padding is what keeps content clear. Any bar background
      // colour would show as a band in the wrong shade during a theme change.
      await StatusBar.setOverlaysWebView({ overlay: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedTheme]);

  /* --- hardware back button --------------------------------------------- */
  useEffect(() => {
    if (!isNative()) return;
    let remove: (() => void) | undefined;

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
      remove = () => handle.remove();
    })();

    return () => remove?.();
  }, [router]);

  /* --- soft keyboard ----------------------------------------------------- */
  useEffect(() => {
    if (!isNative()) return;
    const removers: Array<() => void> = [];

    (async () => {
      const { Keyboard } = await import('@capacitor/keyboard');
      const show = await Keyboard.addListener('keyboardWillShow', (info) => {
        // Published as a variable rather than resizing the webview: the
        // fixed chrome is positioned against the viewport, and resizing it
        // makes the tab bar jump into the middle of the screen.
        document.documentElement.style.setProperty(
          '--keyboard-h',
          `${info.keyboardHeight}px`
        );
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
    })();

    return () => removers.forEach((fn) => fn());
  }, []);

  /* --- splash screen ------------------------------------------------------ */
  useEffect(() => {
    if (!isNative()) return;
    // launchAutoHide is off, so the splash covers hydration instead of
    // uncovering a half-built page. Two frames is enough for the first paint.
    const id = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(async () => {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide({ fadeOutDuration: 200 });
      })
    );
    return () => window.cancelAnimationFrame(id);
  }, []);

  /* --- scroll restoration ------------------------------------------------- */
  useEffect(() => {
    // A webview keeps the scroll offset across a client-side navigation, so
    // a new screen can open halfway down. Native apps always open at the top.
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
