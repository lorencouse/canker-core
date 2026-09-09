import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type CankerClient = SupabaseClient<Database>;

export interface ClientConfig {
  url: string;
  anonKey: string;
  /**
   * Storage for the auth session. Browsers default to localStorage; the
   * Capacitor shell passes a Preferences-backed adapter so sessions survive
   * WebView storage eviction.
   */
  storage?: {
    getItem(key: string): string | null | Promise<string | null>;
    setItem(key: string, value: string): void | Promise<void>;
    removeItem(key: string): void | Promise<void>;
  };
}

export function createCankerClient(config: ClientConfig): CankerClient {
  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      ...(config.storage ? { storage: config.storage } : {})
    }
  });
}
