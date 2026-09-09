import { createCankerClient } from '@canker/db';
import { env } from './env';

export const supabase = createCankerClient({
  url: env.supabaseUrl,
  anonKey: env.supabaseAnonKey
});

/** Where Supabase should send the browser back to after OAuth / magic links. */
export function authRedirectUrl(path = '/auth/callback'): string {
  return env.isNative ? `com.cankercore.app:/${path}` : `${env.siteUrl}${path}`;
}
