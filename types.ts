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
  username: string | null;
  bio: string | null;
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

export interface Product {
  id: string;
  active: boolean | null;
  name: string | null;
  description: string | null;
  image: string | null;
  metadata: Json | null;
}

export type PricingType = 'one_time' | 'recurring';
export type PricingPlanInterval = 'day' | 'week' | 'month' | 'year';

export interface Price {
  id: string;
  product_id: string | null;
  active: boolean | null;
  description: string | null;
  unit_amount: number | null;
  currency: string | null;
  type: PricingType | null;
  interval: PricingPlanInterval | null;
  interval_count: number | null;
  trial_period_days: number | null;
  metadata: Json | null;
}

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'unpaid'
  | 'paused';

export interface Subscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus | null;
  metadata: Json | null;
  price_id: string | null;
  quantity: number | null;
  cancel_at_period_end: boolean | null;
  created: string;
  current_period_start: string;
  current_period_end: string;
  ended_at: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
}

export interface Customer {
  id: string;
  stripe_customer_id: string | null;
  billing_address: Json | null;
  payment_method: Json | null;
}

/** Shapes returned by the joined queries in lib/queries.ts. */
export interface ProductWithPrices extends Product {
  prices: Price[];
}

export interface PriceWithProduct extends Price {
  products: Product | null;
}

export interface SubscriptionWithPrice extends Subscription {
  prices: PriceWithProduct | null;
}
