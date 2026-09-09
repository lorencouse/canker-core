## Canker Core

Canker Core is a web app for tracking and managing your mouth sores. It is built with Next.js, TypeScript, and self-hosted Postgres.

## Features

- [x] Authentication
- [x] Add new sores
- [x] Edit sores
- [x] Delete sores
- [x] View all sores

## Tech Stack

- Next.js
- TypeScript
- Postgres (self-hosted, no ORM — raw SQL over a `pg` pool)
- Better Auth (email/password, magic link, GitHub + Google OAuth)
- Tailwind CSS
- ShadCN

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

## Deployment

Self-hosted on the Coolify VPS, with a Coolify-managed Postgres alongside it.
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), which also covers the one-off
data migration from Supabase.
