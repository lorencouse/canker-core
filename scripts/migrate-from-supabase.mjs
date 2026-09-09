/**
 * One-shot data migration: hosted Supabase -> self-hosted Postgres.
 *
 * Reads every table through the Supabase REST API (service-role key) and writes
 * it into the new database, preserving primary keys so that `sores.user_id`
 * still points at the right person.
 *
 * Emails come from the Auth Admin API, not from `public.users`: this project's
 * `handle_new_user` trigger only ever copied full_name and avatar_url, so
 * `public.users.email` is null for every existing row. The real address lives in
 * `auth.users`, which PostgREST does not expose but the admin endpoint does.
 *
 * Passwords are deliberately NOT migrated. Supabase stores bcrypt hashes in the
 * `auth.users` table, which PostgREST does not expose, and Better Auth salts and
 * formats its own hashes differently. Migrated accounts therefore land with no
 * credential and must use "Forgot password" once. Their data is unaffected.
 *
 * Usage:
 *   node scripts/migrate-from-supabase.mjs            # migrate
 *   node scripts/migrate-from-supabase.mjs --dry-run  # report only, write nothing
 *
 * Required env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   source
 *   DATABASE_URL                              destination
 *
 * Safe to re-run: every write is an idempotent upsert keyed on the primary key.
 */
import pg from 'pg';

const DRY_RUN = process.argv.includes('--dry-run');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.local.supabase-backup).');
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error('Set DATABASE_URL to the destination Postgres instance.');
  process.exit(1);
}

/**
 * Every user in Supabase's auth schema, keyed by id.
 *
 * `public.users.email` is null for rows created by the handle_new_user trigger,
 * so the authoritative address has to come from here.
 */
async function fetchAuthUsers() {
  const byId = new Map();
  let page = 1;

  for (;;) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    });
    if (!res.ok) {
      throw new Error(
        `Failed to read auth users: ${res.status} ${await res.text()}\n` +
        'The service-role key must be the full key from Project Settings > API.'
      );
    }
    const body = await res.json();
    const batch = body.users ?? [];
    for (const u of batch) byId.set(u.id, u);
    if (batch.length < 200) break;
    page++;
  }

  return byId;
}

async function fetchTable(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  if (!res.ok) {
    throw new Error(`Failed to read ${table}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

const stats = {};
const warnings = [];

function record(table, n) {
  stats[table] = n;
}

async function main() {
  console.log(`Source: ${SUPABASE_URL}`);
  console.log(`Destination: ${DATABASE_URL.replace(/:[^:@/]*@/, ':****@')}`);
  console.log(DRY_RUN ? '\nDRY RUN — nothing will be written.\n' : '');

  const [authUsers, users, sores, customers, products, prices, subscriptions] = await Promise.all([
    fetchAuthUsers(),
    fetchTable('users'),
    fetchTable('sores'),
    fetchTable('customers'),
    fetchTable('products'),
    fetchTable('prices'),
    fetchTable('subscriptions')
  ]);

  console.log('Read from Supabase:');
  console.log(`  auth.users     ${authUsers.size}`);
  for (const [name, rows] of Object.entries({ users, sores, customers, products, prices, subscriptions })) {
    console.log(`  ${name.padEnd(14)} ${rows.length}`);
  }
  console.log('');

  // A profile row with no auth row is orphaned; an auth row with no profile row
  // still needs migrating, so iterate the union of both.
  const allUserIds = new Set([...users.map((u) => u.id), ...authUsers.keys()]);

  const client = await pool.connect();
  try {
    if (!DRY_RUN) await client.query('BEGIN');

    // --- users -> "user" -------------------------------------------------
    // Ordered first: every other table references it.
    let userCount = 0;
    const migratedIds = new Set();
    const profileById = new Map(users.map((u) => [u.id, u]));

    for (const id of allUserIds) {
      const u = profileById.get(id) ?? { id };
      const authUser = authUsers.get(id);
      // public.users.email is null for trigger-created rows, so auth.users wins.
      const email = authUser?.email || u.email;

      if (!email) {
        warnings.push(`user ${id} has no email address in auth.users or public.users and was skipped.`);
        continue;
      }
      const meta = authUser?.user_metadata ?? {};
      const name = u.full_name || meta.full_name || u.username || email.split('@')[0];
      const avatar = u.avatar_url ?? meta.avatar_url ?? null;
      // Preserve whether the address was already confirmed in Supabase.
      const verified = Boolean(authUser?.email_confirmed_at);
      if (!DRY_RUN) {
        await client.query(
          `insert into "user" (id, name, email, "emailVerified", image, username, bio, "createdAt", "updatedAt")
           values ($1,$2,$3,$4,$5,$6,$7,$8, now())
           on conflict (id) do update set
             name = excluded.name,
             email = excluded.email,
             "emailVerified" = excluded."emailVerified",
             image = excluded.image,
             username = excluded.username,
             bio = excluded.bio`,
          [id, name, email, verified, avatar, u.username ?? null, u.bio ?? null,
           authUser?.created_at ?? new Date().toISOString()]
        );
      }
      migratedIds.add(id);
      userCount++;
    }
    record('user', userCount);

    // --- OAuth identities -> "account" -----------------------------------
    // A GitHub/Google user who signed in through Supabase keeps working without
    // re-linking, because Better Auth matches on (providerId, accountId).
    let identityCount = 0;
    for (const [id, authUser] of authUsers) {
      if (!migratedIds.has(id)) continue;
      for (const identity of authUser.identities ?? []) {
        if (identity.provider === 'email') continue; // password identity, not portable
        if (!DRY_RUN) {
          await client.query(
            `insert into account (id, "accountId", "providerId", "userId", "createdAt", "updatedAt")
             values ($1,$2,$3,$4, now(), now())
             on conflict ("providerId", "accountId") do nothing`,
            [crypto.randomUUID(), identity.id ?? identity.identity_data?.sub ?? id,
             identity.provider, id]
          );
        }
        identityCount++;
      }
    }
    record('oauth accounts', identityCount);

    // --- customers -------------------------------------------------------
    // billing_address / payment_method lived on public.users in Supabase and
    // move onto customers here.
    const billingByUser = Object.fromEntries(
      users.map((u) => [u.id, { billing_address: u.billing_address ?? null, payment_method: u.payment_method ?? null }])
    );
    let customerCount = 0;
    for (const c of customers) {
      if (!migratedIds.has(c.id)) {
        warnings.push(`customer ${c.id} skipped — no matching migrated user.`);
        continue;
      }
      const billing = billingByUser[c.id] ?? { billing_address: null, payment_method: null };
      if (!DRY_RUN) {
        await client.query(
          `insert into customers (id, stripe_customer_id, billing_address, payment_method)
           values ($1,$2,$3::jsonb,$4::jsonb)
           on conflict (id) do update set
             stripe_customer_id = excluded.stripe_customer_id,
             billing_address = excluded.billing_address,
             payment_method = excluded.payment_method`,
          [
            c.id,
            c.stripe_customer_id ?? null,
            billing.billing_address ? JSON.stringify(billing.billing_address) : null,
            billing.payment_method ? JSON.stringify(billing.payment_method) : null
          ]
        );
      }
      customerCount++;
    }
    record('customers', customerCount);

    // --- products --------------------------------------------------------
    for (const p of products) {
      if (!DRY_RUN) {
        await client.query(
          `insert into products (id, active, name, description, image, metadata)
           values ($1,$2,$3,$4,$5,$6::jsonb)
           on conflict (id) do update set
             active = excluded.active, name = excluded.name,
             description = excluded.description, image = excluded.image,
             metadata = excluded.metadata`,
          [p.id, p.active, p.name, p.description, p.image, JSON.stringify(p.metadata ?? {})]
        );
      }
    }
    record('products', products.length);

    // --- prices ----------------------------------------------------------
    for (const p of prices) {
      if (!DRY_RUN) {
        await client.query(
          `insert into prices (id, product_id, active, description, unit_amount, currency,
                               type, interval, interval_count, trial_period_days, metadata)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
           on conflict (id) do update set
             product_id = excluded.product_id, active = excluded.active,
             description = excluded.description, unit_amount = excluded.unit_amount,
             currency = excluded.currency, type = excluded.type,
             interval = excluded.interval, interval_count = excluded.interval_count,
             trial_period_days = excluded.trial_period_days, metadata = excluded.metadata`,
          [p.id, p.product_id, p.active, p.description, p.unit_amount, p.currency,
           p.type, p.interval, p.interval_count, p.trial_period_days,
           JSON.stringify(p.metadata ?? {})]
        );
      }
    }
    record('prices', prices.length);

    // --- subscriptions ---------------------------------------------------
    let subCount = 0;
    for (const s of subscriptions) {
      if (!migratedIds.has(s.user_id)) {
        warnings.push(`subscription ${s.id} skipped — no matching migrated user.`);
        continue;
      }
      if (!DRY_RUN) {
        await client.query(
          `insert into subscriptions (id, user_id, status, metadata, price_id, quantity,
                                      cancel_at_period_end, created, current_period_start,
                                      current_period_end, ended_at, cancel_at, canceled_at,
                                      trial_start, trial_end)
           values ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
           on conflict (id) do update set
             status = excluded.status, metadata = excluded.metadata,
             price_id = excluded.price_id, quantity = excluded.quantity,
             cancel_at_period_end = excluded.cancel_at_period_end,
             current_period_start = excluded.current_period_start,
             current_period_end = excluded.current_period_end,
             ended_at = excluded.ended_at, cancel_at = excluded.cancel_at,
             canceled_at = excluded.canceled_at, trial_start = excluded.trial_start,
             trial_end = excluded.trial_end`,
          [s.id, s.user_id, s.status, JSON.stringify(s.metadata ?? {}), s.price_id, s.quantity,
           s.cancel_at_period_end, s.created, s.current_period_start, s.current_period_end,
           s.ended_at, s.cancel_at, s.canceled_at, s.trial_start, s.trial_end]
        );
      }
      subCount++;
    }
    record('subscriptions', subCount);

    // --- sores -----------------------------------------------------------
    let soreCount = 0;
    for (const s of sores) {
      if (!migratedIds.has(s.user_id)) {
        warnings.push(`sore ${s.id} skipped — owner ${s.user_id} was not migrated.`);
        continue;
      }
      if (!DRY_RUN) {
        await client.query(
          `insert into sores (id, user_id, zone, gums, x, y, dates, pain, size, healed)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           on conflict (id) do update set
             zone = excluded.zone, gums = excluded.gums, x = excluded.x, y = excluded.y,
             dates = excluded.dates, pain = excluded.pain, size = excluded.size,
             healed = excluded.healed`,
          [s.id, s.user_id, s.zone, s.gums ?? false, s.x, s.y,
           s.dates ?? null, s.pain ?? null, s.size ?? null, s.healed ?? null]
        );
      }
      soreCount++;
    }
    record('sores', soreCount);

    if (!DRY_RUN) await client.query('COMMIT');
  } catch (err) {
    if (!DRY_RUN) await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  console.log(DRY_RUN ? 'Would write:' : 'Written:');
  for (const [table, n] of Object.entries(stats)) {
    console.log(`  ${table.padEnd(14)} ${n}`);
  }

  if (warnings.length) {
    console.log('\nWarnings:');
    for (const w of warnings) console.log(`  - ${w}`);
  }

  console.log(
    '\nMigrated accounts have no password (Supabase hashes are not portable).' +
    '\nEach user signs in once via "Forgot password" to set one, or uses OAuth.'
  );

  await pool.end();
}

main().catch(async (err) => {
  console.error('\nMigration failed:', err.message);
  await pool.end();
  process.exit(1);
});
