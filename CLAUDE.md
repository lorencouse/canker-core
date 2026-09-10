# Canker Core — working notes

Track and manage recurring mouth ulcers. Next.js 15 App Router, React 19,
self-hosted Postgres over a raw `pg` pool (no ORM), Better Auth, Tailwind,
shadcn. Also ships as native iOS/Android via Capacitor.

## Deploying — read this before saying anything is deployed

**Pushing to `main` deploys nothing.** The Coolify application's build pack
is `dockerimage`, not a git source: it serves whatever tag
`localhost:5000/canker-core` points at, and nothing watches the repo. A
deploy is a local arm64 build, an image shipped over SSH, a registry push,
and an API tag switch — the four steps in `docs/DEPLOYMENT.md`.

The VPS runs at its CPU limit, so images are **never** built on the server.

- Coolify app uuid `se1yk2uuejhylof4isj4x5wq`, host alias `coolify`.
- Postgres container `zp1hiabzhkgj4kwo2r9qa0qi`, user and db both `canker`.
- Coolify API is reachable only from the server, `http://localhost:8000`.
  Its token is `COOLIFY_TOKEN` in the sibling `house-finder/.env`. Pass it
  into the remote shell through an unquoted heredoc on stdin, never on the
  command line, so it stays out of the remote process list.

Schema changes have no migration framework: `schema.sql` is the re-runnable
source of truth, and one-off data migrations live in `migrations/` as dated
SQL. Take a `pg_dump` into the gitignored `backups/` before any of it.

Data model: a `sores` row is a place in the mouth; its measurements are rows
in `readings` (one per local day, with an optional note); `day_logs` holds
per-day triggers and treatments from the fixed lists in `utils/day-log.ts`.
The "one reading per day" rule lives in `utils/readings.ts`.

## Mobile

The native apps wrap the deployed site rather than bundling it — server
components, server actions and a Postgres-backed session survive none of
`output: 'export'`. `docs/MOBILE.md` has the packaging, the three route-group
shells, and the layout conventions any new screen should follow. The short
version: `dvh` never `vh`, safe areas through the `--safe-*` variables never
bare `env()`, `size="touch"` on primary controls, and size off
`@media (pointer: coarse)` rather than viewport width.

## Local development

Port 3000 is taken by another project — use `PORT=3100 npm run dev`, and the
machine's LAN IP when driving it from a phone or the iOS simulator.

Leave `SMTP_*` blank locally; magic links print to the server console.

## Conventions

Red is data, never decoration: the `--sev-*` ramp encodes pain and is the
only saturated red in the product. Everything else is cool slate plus one
teal action colour. Comments explain *why*, not what.
