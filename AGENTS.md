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
  Its token is the whole contents of `~/coolify-token` on the VPS (not
  `house-finder/.env`, which has no such key). Read it into a shell variable
  inside an unquoted heredoc on stdin, never on the command line, so it stays
  out of the remote process list — and never print it.

Schema changes have no migration framework: `schema.sql` is the re-runnable
source of truth, and one-off data migrations live in `migrations/` as dated
SQL. Take a `pg_dump` into the gitignored `backups/` before any of it.

Data model: a `sores` row is a place in the mouth; its measurements are rows
in `readings` (one per local day, with an optional note); `day_logs` holds
per-day triggers and treatments from the fixed lists in `utils/day-log.ts`.
The "one reading per day" rule lives in `utils/readings.ts`, and the server
holds it again in `utils/sore-payload.ts`.

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

Analytics are first-party only, by owner decision: no third-party scripts.
The funnel is read from Postgres by `scripts/funnel.sql`; the only tracking is
the first-touch cookie in `utils/first-touch.ts`, and the privacy page says so.

## UI formatting rules

- Buttons, tabs, chips and pills are one line of text, never wrapped: shorten the label or use an icon; ellipsis only as a last resort (`components/ui/button.tsx` enforces it, `button.test.ts` checks it).
- No horizontal page scroll at 320–430px; long words, URLs and numbers wrap or truncate inside their container (grid tracks `grid-cols-1`/`minmax(0,1fr)`, flex children `min-w-0`).
- Tap targets are at least 44×44px on touch: size up with the `coarse:` variant, or add `.tap-target` to widen the hit area without redrawing.
- Text inputs are at least 16px on touch, so iOS does not zoom on focus (global in `styles/main.css`).
- Headings use `text-wrap: balance` and body copy `text-wrap: pretty` (both global in `styles/main.css`).
- Truncated text shows an ellipsis (`truncate`), never clips or spills; single-line labels inside flex/grid get `min-w-0`.
- Changing or aligned figures use tabular numerals (`.tabular`; tables, `time`, `data`, `output` get it globally).
- Body text runs at most about 70 characters a line (`.prose-measure`).
- Labels and buttons are sentence case in source (the display face uppercases via CSS); no em-dashes in UI copy.
- Use the existing spacing, radius and colour tokens; no one-off magic values.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
