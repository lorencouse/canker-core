-- Canker Core — Postgres schema (self-hosted).
--
-- Replaces the Supabase-managed schema. Two things changed structurally:
--
--   1. No RLS. Supabase's policies leaned on auth.uid(), which only exists
--      because GoTrue injects JWT claims into the Postgres session. Here the app
--      connects as a single role, so ownership is enforced in the query layer
--      (every sore/subscription read is scoped by the session's user id in
--      lib/queries.ts) rather than by the database.
--
--   2. No public.users mirror table and no on_auth_user_created trigger. Better
--      Auth owns the "user" table directly, so profile columns live on it.
--
-- Auth table definitions below were generated from better-auth 1.7.3's own
-- schema for this exact config — do not hand-edit them out of sync with lib/auth.ts.

-- ---------------------------------------------------------------------------
-- Better Auth tables
-- ---------------------------------------------------------------------------

create table if not exists "user" (
  "id" text primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null default false,
  "image" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  -- Application profile fields (declared as user.additionalFields in lib/auth.ts).
  "username" text,
  "bio" text
);

create table if not exists "session" (
  "id" text primary key,
  "expiresAt" timestamptz not null,
  "token" text not null unique,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null,
  constraint "session_userId_fkey" foreign key ("userId") references "user" ("id") on delete cascade
);
create index if not exists "session_userId_idx" on "session" ("userId");
create index if not exists "session_expiresAt_idx" on "session" ("expiresAt");

create table if not exists "account" (
  "id" text primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "account_userId_fkey" foreign key ("userId") references "user" ("id") on delete cascade
);
create index if not exists "account_userId_idx" on "account" ("userId");
create unique index if not exists "account_provider_account_idx" on "account" ("providerId", "accountId");

create table if not exists "verification" (
  "id" text primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index if not exists "verification_identifier_idx" on "verification" ("identifier");

-- ---------------------------------------------------------------------------
-- Billing (synced from Stripe by app/api/webhooks/route.ts)
-- ---------------------------------------------------------------------------

-- Private mapping of user id -> Stripe customer id. Never exposed to the client.
create table if not exists customers (
  id text primary key references "user" ("id") on delete cascade,
  stripe_customer_id text,
  -- Moved here from Supabase's public.users so they can stay jsonb.
  billing_address jsonb,
  payment_method jsonb
);
create index if not exists customers_stripe_customer_id_idx on customers (stripe_customer_id);

create table if not exists products (
  id text primary key,
  active boolean,
  name text,
  description text,
  image text,
  metadata jsonb
);

do $$ begin
  create type pricing_type as enum ('one_time', 'recurring');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pricing_plan_interval as enum ('day', 'week', 'month', 'year');
exception when duplicate_object then null; end $$;

create table if not exists prices (
  id text primary key,
  product_id text references products (id) on delete cascade,
  active boolean,
  description text,
  unit_amount bigint,
  currency text check (char_length(currency) = 3),
  type pricing_type,
  interval pricing_plan_interval,
  interval_count integer,
  trial_period_days integer,
  metadata jsonb
);
create index if not exists prices_product_id_idx on prices (product_id);

do $$ begin
  create type subscription_status as enum (
    'trialing', 'active', 'canceled', 'incomplete',
    'incomplete_expired', 'past_due', 'unpaid', 'paused'
  );
exception when duplicate_object then null; end $$;

create table if not exists subscriptions (
  id text primary key,
  user_id text not null references "user" ("id") on delete cascade,
  status subscription_status,
  metadata jsonb,
  price_id text references prices (id),
  quantity integer,
  cancel_at_period_end boolean,
  created timestamptz not null default now(),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default now(),
  ended_at timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz
);
create index if not exists subscriptions_user_id_idx on subscriptions (user_id);

-- ---------------------------------------------------------------------------
-- Application data
-- ---------------------------------------------------------------------------

-- Column types mirror what the app actually reads and writes:
--   dates  text[]              — rendered with `new Date(str)`; kept as ISO strings
--                                so the pg driver does not coerce them to Date objects
--                                and change the shape the components already expect.
--   size / pain  double precision[]  — slider values, appended one entry per update.
--   view / x / y                     — the mouth-map view and the position within it,
--                                      as percentages of the view's drawing box.
create table if not exists sores (
  id text primary key,
  user_id text not null references "user" ("id") on delete cascade,
  zone text not null,
  -- Which flat view of the mouth map the sore was plotted on: front | cheeks | lips.
  view text not null default 'front',
  x double precision,
  y double precision,
  dates text[],
  pain double precision[],
  size double precision[],
  healed text
);
create index if not exists sores_user_id_idx on sores (user_id);
