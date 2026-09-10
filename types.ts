import type { MouthView } from '@/utils/mouth-map/geometry';

/**
 * Application types.
 *
 * Previously generated from the Supabase schema into types_db.ts by
 * `supabase gen types`. With a self-hosted database there is no generator in the
 * loop, so these are maintained by hand alongside schema.sql.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Signed-in user, assembled from the Better Auth session. */
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Sore {
  id: string;
  user_id: string;
  /** Derived from view + x/y; stored so history queries can show it. */
  zone: string;
  /** Which flat view of the mouth the sore was plotted on. */
  view: MouthView;
  /** Percent of the view's drawing box, 0-100. */
  x: number | null;
  y: number | null;
  /** ISO timestamp strings, one appended per update. */
  dates: string[] | null;
  pain: number[] | null;
  size: number[] | null;
  healed: string | null;
}
