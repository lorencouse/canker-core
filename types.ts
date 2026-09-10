import type { MouthView } from '@/utils/mouth-map/geometry';

/**
 * Application types.
 *
 * Maintained by hand alongside schema.sql — there is no generator in the loop
 * with a self-hosted database.
 */

/** Signed-in user, assembled from the Better Auth session. */
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

/** One measurement of a sore. At most one per sore per local day. */
export interface Reading {
  id: string;
  /** ISO timestamp. */
  recorded_at: string;
  /** Width in millimetres. */
  size: number;
  /** 1-10. */
  pain: number;
  note: string | null;
}

export interface Sore {
  id: string;
  user_id: string;
  /** Which flat view of the mouth the sore was plotted on. */
  view: MouthView;
  /** Percent of the view's drawing box, 0-100. */
  x: number | null;
  y: number | null;
  /** Derived from view + x/y; stored so history queries can show it. */
  zone: string;
  /** ISO timestamp of when it was first marked. Day 1. */
  created_at: string;
  /** ISO timestamp, or null while the sore is still open. */
  healed_at: string | null;
  /** Oldest first. Never empty for a saved sore. */
  readings: Reading[];
}

/** What else happened on a day: suspected causes and what was tried. */
export interface DayLog {
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
  triggers: string[];
  treatments: string[];
  note: string | null;
}
