import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

/**
 * Capacitor packaging.
 *
 * Canker Core is a Next.js app with server components, server actions, and a
 * Postgres-backed session — none of which survive a static export. So the
 * native app is not a bundled copy of the site: it is a native shell whose
 * webview loads the deployed app over https, with `native/shell` as the local
 * bundle shown while the network is unreachable.
 *
 * The practical consequences, so they are not surprises later:
 *   - The app needs a connection. The offline shell exists to say so nicely.
 *   - A deploy ships to the app too, with no store review.
 *   - Session cookies are real cookies on CAPACITOR_SERVER_URL's origin, so
 *     the OAuth callbacks and Better Auth cookie both keep working unchanged.
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.replace(/\/+$/, '') ||
  'https://cankercore.com';

const config: CapacitorConfig = {
  appId: 'com.cankercore.app',
  appName: 'Canker Core',
  webDir: 'native/shell',

  server: {
    url: serverUrl,
    // The webview refuses to load anything off-origin unless it is listed.
    // These are the OAuth providers the sign-in page hands off to.
    allowNavigation: [
      new URL(serverUrl).host,
      'accounts.google.com',
      'github.com'
    ],
    androidScheme: 'https'
  },

  ios: {
    // The web layer paints its own background under the notch; a white
    // native background flashes on rotate and on theme change.
    backgroundColor: '#131a21',
    contentInset: 'never'
  },

  android: {
    backgroundColor: '#131a21'
  },

  plugins: {
    SplashScreen: {
      launchAutoHide: false, // Hidden by the app once the first paint lands.
      backgroundColor: '#131a21',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      // Style is set per theme at runtime; this is only the cold-start value.
      overlaysWebView: true,
      style: 'DARK'
    },
    Keyboard: {
      // Chrome is fixed, so resizing the webview would fight the safe-area
      // padding. The app lifts affected surfaces itself via --keyboard-h.
      resize: KeyboardResize.None
    }
  }
};

export default config;
