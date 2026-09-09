/**
 * Postgres connection pool.
 *
 * Mirrors the `lib/db/pool.ts` idiom used in maleq-headless (raw SQL over a
 * shared pool, no ORM) — the difference being Postgres rather than MySQL,
 * because the `sores` table relies on Postgres array columns.
 *
 * The pool is cached on `globalThis` so Next.js dev hot-reloads reuse a single
 * pool instead of leaking a new one on every module reload.
 */
import { Pool, type PoolClient, type QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __cankerPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

/**
 * A real `Pool` instance — not a lazy wrapper.
 *
 * `pg.Pool` does not open a connection when constructed, only on first use, so
 * building the image without database credentials is fine. It must be a genuine
 * Pool rather than a proxy because Better Auth selects its database adapter with
 * an `instanceof` check.
 */
function createPool(): Pool {
  const created = new Pool({
    connectionString,
    // Coolify's managed Postgres terminates TLS at the container boundary and
    // presents a self-signed cert, so verification is disabled but transport
    // encryption is kept. Local dev over a plain socket needs no TLS at all.
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  });

  // A pool-level error (e.g. the DB restarting) is emitted on idle clients;
  // without a listener Node treats it as an unhandled 'error' event and kills
  // the process.
  created.on('error', (err) => {
    console.error('[db] idle client error', err);
  });

  return created;
}

// Cached on globalThis so Next.js dev hot-reloads reuse one pool instead of
// leaking a new one on every module reload.
export const pool: Pool = globalThis.__cankerPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__cankerPool = pool;
}

function assertConfigured(): void {
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Postgres instance.'
    );
  }
}

/** Run a query and return all rows. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  assertConfigured();
  const result = await pool.query<T>(text, params as never[]);
  return result.rows;
}

/** Run a query and return the first row, or null when there is none. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Run several statements inside a single transaction. */
export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  assertConfigured();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
