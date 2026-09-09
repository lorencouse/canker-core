import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The native shell ships the exact bundle that runs at app.cankercore.com.
 * Build the SPA first (`pnpm --filter @canker/app build`), then `pnpm sync`.
 */
const config: CapacitorConfig = {
  appId: 'com.cankercore.app',
  appName: 'Canker Core',
  webDir: '../app/dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#F6F7FA'
  },
  android: {
    backgroundColor: '#F6F7FA'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#F6F7FA'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
