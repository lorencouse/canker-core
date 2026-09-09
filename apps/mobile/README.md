# @canker/mobile

Capacitor wrapper for the tracker. Phase 3 of the roadmap; the config is here
so the web app is built with the native shell in mind from day one.

## First-time setup (needs Xcode / Android Studio)

```sh
pnpm --filter @canker/app build     # produces apps/app/dist
pnpm --filter @canker/mobile add:ios
pnpm --filter @canker/mobile add:android
pnpm --filter @canker/mobile sync
pnpm --filter @canker/mobile open:ios
```

The generated `ios/` and `android/` folders are committed once created; the
web assets copied into them are ignored (see root `.gitignore`).

## Auth on native

Supabase redirects back to `com.cankercore.app://auth/callback`. Register that
scheme in `Info.plist` (`CFBundleURLSchemes`) and `AndroidManifest.xml` (an
intent filter on the main activity), and add the URL to the project's allowed
redirect URLs in the Supabase dashboard. `apps/app/src/lib/supabase.ts`
already switches the redirect when it detects the native platform.

## Reminders

Daily reminders are scheduled server-side by timezone (pg_cron → Edge
Function → APNs/FCM) so they fire even if the app was never opened that day.
Local notifications are the fallback when a user declines push permission.
