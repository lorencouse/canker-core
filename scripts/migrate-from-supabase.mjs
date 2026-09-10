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

  // The starter's Stripe tables (customers, products, prices, subscriptions)
  // were dropped from the schema and are no longer copied.
  const [authUsers, users, sores] = await Promise.all([
    fetchAuthUsers(),
    fetchTable('users'),
    fetchTable('sores')
  ]);

  console.log('Read from Supabase:');
  console.log(`  auth.users     ${authUsers.size}`);
  for (const [name, rows] of Object.entries({ users, sores })) {
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
          `insert into "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
           values ($1,$2,$3,$4,$5,$6, now())
           on conflict (id) do update set
             name = excluded.name,
             email = excluded.email,
             "emailVerified" = excluded."emailVerified",
             image = excluded.image`,
          [id, name, email, verified, avatar,
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
