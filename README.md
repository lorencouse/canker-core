## Canker Core

Canker Core is a web app for tracking and managing your mouth sores. It is built with Next.js, TypeScript, and self-hosted Postgres.

## Features

- **Mouth map** — three flat views (front, cheeks, lips); tap or place-by-name
  to mark a sore, drag or arrow-key to move it, pinch/wheel to zoom.
- **Daily readings** — width in mm and pain 1–10, one reading per sore per
  day, with an optional note. Same-day changes correct the reading; a new day
  appends one.
- **Today** — the check-in screen: every open sore with its sliders, a
  "same as last time" shortcut, and the day's log of suspected triggers and
  treatments tried. A daily reminder on iOS/Android.
- **Healed / reopen**, with healed sores hidden from the map by default.
- **History** — headline figures (open now, typical days to heal, worst pain,
  most common spot), size-over-time chart, a patterns tally of what was
  logged before each sore, and each sore's own course with its notes.
- **A nudge past two weeks** that a long-running sore is worth a dentist.
- **Account** — name/email, password, CSV export of every reading, and
  self-serve account deletion.
- Email/password, magic link, GitHub and Google sign-in.

## Tech Stack

- Next.js
- TypeScript
- Postgres (self-hosted, no ORM — raw SQL over a `pg` pool)
- Better Auth (email/password, magic link, GitHub + Google OAuth)
- Tailwind CSS
- ShadCN
- Capacitor (iOS + Android shells)

## Local development

```bash
npm install
cp .env.example .env.local        # then fill in DATABASE_URL + BETTER_AUTH_SECRET

createdb canker
npm run db:schema                 # applies schema.sql (needs DATABASE_URL set)

npm run dev
```

Leave `SMTP_*` blank locally — magic links and password-reset links are printed
to the server console instead of being emailed.

Generate an auth secret with `openssl rand -base64 32`.

## Mobile

The same app runs as a responsive website, an installable PWA, and native
iOS/Android apps built with Capacitor. The native apps are a shell around
the deployed site rather than a bundled copy of it.

See [docs/MOBILE.md](docs/MOBILE.md) for the packaging, the app-shell
layout, and the conventions any new screen should follow.

```bash
npm run cap:add:ios      # once per machine
npm run cap:ios          # sync and open Xcode
```

## Deployment

Self-hosted on the Coolify VPS, with a Coolify-managed Postgres alongside it.
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), which also covers the one-off
data migration from Supabase.
