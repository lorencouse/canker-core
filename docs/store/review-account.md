# The store review account

App Review and Play review both need to sign in, because every record
belongs to an account. One account serves both stores.

- **Email:** `appreview@cankercore.com`. App Store Connect already lists it
  under App Review Information > Sign-In Information, with a password.
- **Password:** whatever is saved in App Store Connect. Only the owner sets
  it; it is never committed, logged or put in a brief. Use the same one in
  Play Console > App content > App access.

## Create it (owner)

On 2026-11-16 this account did **not** exist in production, while iOS 1.0 was
already waiting for review with it named in Sign-In Information. Create it
before the review starts:

1. Open https://cankercore.com/signin/signup in a private window and sign
   up with `appreview@cankercore.com` and the password saved in App Store
   Connect (or set a new one in both places).
2. Verify the email: the link goes to the `appreview@` mailbox (or, if that
   address has no mailbox, mark it verified in the database:
   `update "user" set "emailVerified" = true where email = 'appreview@cankercore.com';`).
3. Sign in once and finish the welcome flow, so the reviewer lands on Today.
4. Give it a history (optional but kinder to the reviewer): on the server,
   with the database URL from the Coolify app,

   ```bash
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v email=appreview@cankercore.com \
     -f scripts/seed-review-account.sql
   ```

   That writes four sores (three healed, one healing), a month of daily logs
   and check-ins, dated relative to today. It only ever touches an
   `appreview…@cankercore.com` account and replaces that account's own
   records, so re-running it before a later review is safe.

5. Check it: sign in as the account in the app and confirm Today, the map,
   a sore's chart and Insights all show data.

Keep the account after approval: every update is reviewed with it.
