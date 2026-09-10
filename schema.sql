-- Canker Core — Postgres schema (self-hosted).
--
-- Replaces the Supabase-managed schema. Two things changed structurally:
--
--   1. No RLS. Supabase's policies leaned on auth.uid(), which only exists
--      because GoTrue injects JWT claims into the Postgres session. Here the app
--      connects as a single role, so ownership is enforced in the query layer
--      (every sore read is scoped by the session's user id in
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
