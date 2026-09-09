# Deployment

Canker Core runs on the **Coolify VPS at `46.224.227.119`** — the same box and the
same pattern as `maleq-headless`: the app is built from the GitHub repo and served
behind Coolify's bundled Traefik proxy, which issues TLS via Let's Encrypt.

The difference from maleq is the database. maleq talks to a separate
WordPress/MySQL host; Canker Core owns its data, so it gets a **Coolify-managed
Postgres service on the same VPS**. No extra machine, no managed-database bill.

---

## Architecture

```
                    ┌──────────────────────────────────────────┐
  Internet ──443──► │ Traefik (Coolify)     TLS termination     │
                    └───────────────┬──────────────────────────┘
                                    │ :3000
                    ┌───────────────▼──────────────────────────┐
                    │ canker-core (Next.js standalone, Docker) │
                    │   Better Auth runs in-process            │
                    └───────────────┬──────────────────────────┘
                                    │ :5432 (internal network)
                    ┌───────────────▼──────────────────────────┐
                    │ Postgres 16 (Coolify managed service)    │
                    └──────────────────────────────────────────┘
```

Auth is a library inside the app process, not a service — there is nothing extra
to run, monitor, or pay for.

---

## Deployed resources

Created on the Coolify VPS (`46.224.227.119`), project **Canker Core**:

| Resource | UUID / value |
|---|---|
| Project | `0y1yh6n2gespythamcoewcod` |
| Environment | `production` |
| Postgres 16 | `zp1hiabzhkgj4kwo2r9qa0qi` (internal host, port 5432, db/user `canker`) |
| Application | `se1yk2uuejhylof4isj4x5wq` |
| Image | `localhost:5000/canker-core:<git-sha>` |
| Staging URL | `https://canker.46.224.227.119.sslip.io` |

`sslip.io` resolves any `<anything>.<ip>.sslip.io` to that IP, so Traefik issues a
real certificate without touching DNS. Handy for verifying before cutover.

---

## Building and shipping an image

The VPS runs at its CPU limit (load ~4 on 4 vCPUs, with kouzr's containers
already saturating it), so **images are built locally and shipped**, never built
on the server. This mirrors how kouzr deploys — its images come from the same
`kouzr-registry` container.

```bash
SHA=$(git rev-parse --short HEAD)

# 1. Build for the VPS architecture (arm64; an Apple Silicon Mac matches natively)
docker build --platform linux/arm64 \
  --build-arg NEXT_PUBLIC_SITE_URL="" \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="" \
  -t canker-core:$SHA .

# 2. Stream it to the VPS.
#    Note: pushing to localhost:5000 through an SSH tunnel does NOT work when
#    Docker runs in a VM (colima) — the daemon's "localhost" is the VM's, not
#    your Mac's. Streaming over SSH sidesteps that entirely.
docker save canker-core:$SHA | gzip -1 | ssh coolify "gunzip | docker load"

# 3. Push into the on-box registry from the VPS
ssh coolify "docker tag canker-core:$SHA localhost:5000/canker-core:$SHA \
  && docker push -q localhost:5000/canker-core:$SHA"

# 4. Point the app at the new tag and redeploy (Coolify UI, or the API)
```

The registry is bound to `127.0.0.1:5000` and is not reachable from the
internet.

---

## Changing the public domain

The image is domain-agnostic: `SITE_URL` and `BETTER_AUTH_URL` are plain runtime
variables, and the browser auth client uses its own origin. Cutover is therefore
**an environment change and a restart — no rebuild**:

1. Point DNS for `cankercore.com` at `46.224.227.119` (currently it resolves to
   Vercel at `76.76.21.21`).
2. In Coolify, set the application's domain to `https://cankercore.com`, and
   update `SITE_URL` and `BETTER_AUTH_URL` to match.
3. Redeploy (restart). Traefik requests the certificate automatically.
4. Update the OAuth callback URLs with GitHub and Google, and the Stripe webhook
   endpoint.

---

## First-time setup

### 1. Create the Postgres service

In the Coolify dashboard: **+ New → Database → PostgreSQL 16**, in the same
project as the app so they share an internal network.

Note the internal connection string Coolify generates. It looks like:

```
postgresql://<user>:<password>@<service-name>:5432/<db>
```

Use the **internal** hostname, not a public one — the database should never be
exposed to the internet.

### 2. Apply the schema

Already done for the current deployment; these are the steps to repeat it.

Connect to the database and run `schema.sql`. From your machine, via the Coolify
terminal for the Postgres service, or over an SSH tunnel:

```bash
# Tunnel Postgres to localhost:5433
ssh -L 5433:localhost:5432 deploy@46.224.227.119

# In another shell
psql "postgresql://<user>:<password>@127.0.0.1:5433/<db>" -v ON_ERROR_STOP=1 -f schema.sql
```

Or with the repo's helper:

```bash
DATABASE_URL="postgresql://..." npm run db:schema
```

### 3. Create the application

**+ New → Application → from GitHub**, pointing at this repo's `main` branch.
Coolify detects the `Dockerfile` and builds with it.

Set the domain (e.g. `cankercore.com`); Traefik requests the certificate
automatically once DNS points at `46.224.227.119`.

### 4. Environment variables

Set these in Coolify's **Environment Variables** panel. Mark the two
`NEXT_PUBLIC_*` values as **build-time** variables — they are inlined into the
client bundle and must exist during `npm run build`. Everything else is read at
runtime.

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Build-time.** Full public URL, no trailing slash |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **Build-time.** Blank is fine until billing goes live |
| `DATABASE_URL` | Internal connection string from step 1 |
| `DATABASE_SSL` | `true` if the Postgres service terminates TLS |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32`. Changing it logs everyone out |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional, enables the GitHub button |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional, enables the Google button |
| `SMTP_HOST` / `SMTP_PORT` | Defaults to `smtp.mail.me.com` / `587` |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | The mailbox that sends auth email |
| `EMAIL_FROM` | e.g. `Canker Core <no-reply@cankercore.com>` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Only needed once billing is live |

> Without `SMTP_USERNAME`/`SMTP_PASSWORD` the app logs auth emails to the
> container log instead of sending them. Fine locally, **not** in production —
> password resets and magic links would silently never arrive.

### 5. OAuth callback URLs

Register these with each provider:

```
https://<your-domain>/api/auth/callback/github
https://<your-domain>/api/auth/callback/google
```

### 6. Stripe webhook

Point the Stripe webhook at `https://<your-domain>/api/webhooks` and copy the
signing secret into `STRIPE_WEBHOOK_SECRET`.

---

## Migrating the data from Supabase

Run once, after the schema is applied and before cutting DNS over.

```bash
# Credentials from the pre-migration .env.local, kept as .env.local.supabase-backup
SUPABASE_URL="https://<project>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
DATABASE_URL="postgresql://..." \
node scripts/migrate-from-supabase.mjs --dry-run   # report first

# Then for real (drop --dry-run)
```

The script is idempotent — re-running it upserts rather than duplicating, so it
is safe to run again to pick up rows created after the first pass.

**Passwords do not migrate.** Supabase keeps bcrypt hashes in `auth.users`, which
is not reachable over its REST API, and Better Auth formats hashes differently.
Every migrated account therefore arrives with no password and must use
**Forgot password** once (or sign in with GitHub/Google, which does carry over —
the script copies OAuth identities into the `account` table).

Tell existing users this before cutover.

---

## Ongoing operations

### Backups

Coolify can schedule Postgres backups per service — enable them. For an ad-hoc
dump, following the same SSH-streamed pattern maleq uses:

```bash
ssh deploy@46.224.227.119 \
  "docker exec <postgres-container> pg_dump -U <user> <db> --no-owner" \
  | gzip -1 > backups/canker-$(date +%Y%m%d_%H%M%S).sql.gz
```

### Schema changes

There is no migration framework. `schema.sql` is the source of truth and is
written to be re-runnable (`create table if not exists`, guarded `create type`).
For a change: edit `schema.sql`, then apply the corresponding `alter table`
against production by hand. Keep the two in step. One-off data migrations that
go with a schema change live in `migrations/` as dated SQL files; run them once,
in order, after deploying the code that expects them.

### Deploys

Push to `main`; Coolify rebuilds and redeploys. Rollback is a redeploy of the
previous commit from the Coolify UI.
