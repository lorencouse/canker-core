/**
 * Demo mode runs the whole app against an in-memory dataset (see lib/demo).
 * It is opt-in at build/dev time so a normal build can never fall back to it
 * by accident.
 */
const demo = (import.meta.env.VITE_DEMO_MODE as string | undefined) === 'true';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!demo && (!url || !anonKey)) {
  const missing = [
    url ? null : 'VITE_SUPABASE_URL',
    anonKey ? null : 'VITE_SUPABASE_ANON_KEY'
  ]
    .filter(Boolean)
    .join(' and ');
  throw new Error(
    `Missing ${missing}. Copy .env.example to .env at the repo root, run ` +
      '`pnpm supabase:start` and paste the printed anon key into it, then ' +
      'restart the dev server (Vite only reads .env at startup). No Docker? ' +
      'Run `pnpm dev:demo` for the offline demo dataset instead.'
  );
}

export const env = {
  /** True when the app is running on the in-memory demo backend. */
  demo,
  // Placeholders keep `createClient` happy in demo mode; it is never called.
  supabaseUrl: url ?? 'https://demo.invalid',
  supabaseAnonKey: anonKey ?? 'demo-anon-key',
  siteUrl:
    (import.meta.env.VITE_SITE_URL as string | undefined) ?? window.location.origin,
  /** True inside the Capacitor shell. Set by apps/mobile at build time. */
  isNative: Boolean(
    (
      window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
    ).Capacitor?.isNativePlatform?.()
  )
};
