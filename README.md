# Canker Core

A daily check-in app for people who get recurring canker sores. Log each sore's
size and pain once a day, tap the factors that applied, and let the app find
the patterns: how long sores last, how often they come, what tends to come
before them, and what tends to help.

This is the v2 rebuild. The previous Next.js app lives read-only in `legacy/`
until the migration is verified against production data, then it is deleted.

## Layout

```
apps/
  app/      Vite + React 19 SPA — the tracker. Served at app.cankercore.com and
            wrapped unchanged by Capacitor.
  web/      Next.js 15 — marketing site, guides, pricing. cankercore.com.
  mobile/   Capacitor shell for iOS/Android (config only until Phase 3).
packages/
  core/     Domain types, zod schemas, date helpers, and the insights engine.
            Pure TypeScript, fully unit-tested.
  db/       Supabase client factory, generated Database types, typed queries
            and mutations.
  ui/       shadcn-style components on Tailwind v4, design tokens, and the SVG
            mouth map.
supabase/   Config, migrations, seed. The database is the source of truth.
legacy/     The old app. Do not build on it.
```

## Running it

Requires Node 22+, pnpm 10+, and Docker (for local Supabase).

```sh
pnpm install
cp .env.example .env
pnpm supabase:start          # prints the anon key; paste into .env
pnpm supabase:reset          # applies migrations + seed (dev@cankercore.test / password123)
pnpm dev:app                 # tracker on http://localhost:5173
pnpm dev:web                 # marketing on http://localhost:3000
```

Other useful scripts: `pnpm test` (core), `pnpm typecheck`, `pnpm build`,
`pnpm supabase:types` (regenerate `packages/db/src/database.types.ts`).

## Data model in one paragraph

A `sore` has a `surface` (one of 14 named mouth surfaces), a normalised
position within it, an onset date and an optional healed date. It accumulates
one `sore_log` per day (size in mm, pain 0–10). A `daily_entry` holds the
whole-person context for a day (sleep, stress) and links to `factors` (foods,
medications, treatments, illnesses…) through `entry_factors`. Flare-ups are
derived, never stored. See `supabase/migrations/20260909000000_v2_schema.sql`.

## Deploying the schema to the existing project

The hosted database already has the starter tables and the old `sores` table,
which were never in this repo's migrations. Before pushing:

```sh
supabase link
supabase migration repair --status applied 20230530034630
supabase migration repair --status applied 20240101000000
supabase db push             # runs the v2 schema + data migration
```

Take a backup first. The data migration is idempotent and leaves the old table
in place as `sores_legacy`.

## Roadmap

See the proposal document for the full plan. In short: Phase 0 foundation
(this), Phase 1 the daily loop on the web, Phase 2 insights and history,
Phase 3 native, Phase 4 the acquisition site, Phase 5 Pro tier.
