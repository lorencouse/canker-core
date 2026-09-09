const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env at the repo root.'
  );
}

export const env = {
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  siteUrl:
    (import.meta.env.VITE_SITE_URL as string | undefined) ?? window.location.origin,
  /** True inside the Capacitor shell. Set by apps/mobile at build time. */
  isNative: Boolean(
    (
      window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
    ).Capacitor?.isNativePlatform?.()
  )
};
