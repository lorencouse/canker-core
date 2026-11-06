import { describe, expect, it } from 'vitest';
import {
  HANDOFF_TTL_SECONDS,
  PENDING_TTL_SECONDS,
  handoffIdentifier,
  holdPending,
  mintHandoff,
  pendingIdentifier,
  redeemHandoff,
  takePending,
  sameSecret,
  type HandoffStore
} from './native-handoff';
import { randomNonce } from './native-auth';

/** Mirrors Better Auth's verification table: take deletes, put stores. It
 * deliberately does not enforce expiry, so the tests prove redeemHandoff
 * does it on its own. */
function memoryStore() {
  const rows = new Map<string, { value: string; expiresAt: Date }>();
  const store: HandoffStore = {
    put: async (identifier, value, expiresAt) => {
      rows.set(identifier, { value, expiresAt });
    },
    take: async (identifier) => {
      const row = rows.get(identifier) ?? null;
      rows.delete(identifier);
      return row;
    }
  };
  return { store, rows };
}

const t0 = new Date('2026-11-05T12:00:00Z');
const later = (seconds: number) => new Date(t0.getTime() + seconds * 1000);

describe('handoff tokens', () => {
  it('mints a 256-bit base64url token and stores only its hash', async () => {
    const { store, rows } = memoryStore();
    const nonce = randomNonce();
    const token = await mintHandoff(store, { userId: 'u1', nonce }, t0);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const [[identifier, row]] = Array.from(rows);
    expect(identifier).toBe(handoffIdentifier(token));
    expect(identifier).not.toContain(token);
    expect(row.value).not.toContain(token);
    expect(row.value).not.toContain(nonce);
    expect(row.expiresAt).toEqual(later(HANDOFF_TTL_SECONDS));
  });

  it('never mints the same token twice', async () => {
    const { store } = memoryStore();
    const nonce = randomNonce();
    const tokens = new Set<string>();
    for (let i = 0; i < 50; i++)
      tokens.add(await mintHandoff(store, { userId: 'u1', nonce }, t0));
    expect(tokens.size).toBe(50);
  });

  it('redeems once, for the right user, within the minute', async () => {
    const { store } = memoryStore();
    const nonce = randomNonce();
    const token = await mintHandoff(store, { userId: 'u1', nonce }, t0);
    expect(await redeemHandoff(store, { token, nonce }, later(59))).toEqual({
      ok: true,
      userId: 'u1'
    });
    expect(await redeemHandoff(store, { token, nonce }, later(59))).toEqual({
      ok: false,
      reason: 'invalid_token'
    });
  });

  it('refuses an expired token', async () => {
    const { store } = memoryStore();
    const nonce = randomNonce();
    const token = await mintHandoff(store, { userId: 'u1', nonce }, t0);
    expect(
      await redeemHandoff(store, { token, nonce }, later(HANDOFF_TTL_SECONDS))
    ).toEqual({ ok: false, reason: 'expired_token' });
  });

  it('refuses a wrong or malformed token', async () => {
    const { store } = memoryStore();
    const nonce = randomNonce();
    await mintHandoff(store, { userId: 'u1', nonce }, t0);
    for (const token of [
      randomNonce(),
      '',
      'short',
      null,
      'x'.repeat(43) + '!'
    ]) {
      expect(await redeemHandoff(store, { token, nonce }, t0)).toEqual({
        ok: false,
        reason: 'invalid_token'
      });
    }
  });

  it('refuses a token presented with another nonce, and burns it', async () => {
    const { store } = memoryStore();
    const nonce = randomNonce();
    const token = await mintHandoff(store, { userId: 'u1', nonce }, t0);
    expect(
      await redeemHandoff(store, { token, nonce: randomNonce() }, t0)
    ).toEqual({ ok: false, reason: 'wrong_device' });
    // The rightful webview cannot use it afterwards either: one shot only.
    expect(await redeemHandoff(store, { token, nonce }, t0)).toEqual({
      ok: false,
      reason: 'invalid_token'
    });
  });

  it('refuses a token presented with no nonce', async () => {
    const { store } = memoryStore();
    const token = await mintHandoff(
      store,
      { userId: 'u1', nonce: randomNonce() },
      t0
    );
    expect(await redeemHandoff(store, { token, nonce: '' }, t0)).toEqual({
      ok: false,
      reason: 'wrong_device'
    });
  });

  it('will not mint without a user or a well-formed nonce', async () => {
    const { store } = memoryStore();
    await expect(
      mintHandoff(store, { userId: '', nonce: randomNonce() })
    ).rejects.toThrow();
    await expect(
      mintHandoff(store, { userId: 'u1', nonce: 'abc' })
    ).rejects.toThrow();
  });
});

describe('pending handoffs', () => {
  it('hold a user for one flow for five minutes, keyed by its hash', async () => {
    const { store, rows } = memoryStore();
    const flow = randomNonce();
    await holdPending(store, { userId: 'u1', flow }, t0);
    const [[identifier, row]] = Array.from(rows);
    expect(identifier).toBe(pendingIdentifier(flow));
    expect(identifier).not.toContain(flow);
    expect(row.value).not.toContain(flow);
    expect(row.expiresAt).toEqual(later(PENDING_TTL_SECONDS));
    expect(PENDING_TTL_SECONDS).toBeLessThanOrEqual(300);
  });

  it('are taken once, by the same flow only', async () => {
    const { store } = memoryStore();
    const flow = randomNonce();
    await holdPending(store, { userId: 'u1', flow }, t0);
    expect(await takePending(store, randomNonce(), later(1))).toBeNull();
    expect(await takePending(store, flow, later(1))).toEqual({ userId: 'u1' });
    expect(await takePending(store, flow, later(2))).toBeNull();
  });

  it('expire after five minutes, even in a store that forgets to', async () => {
    const { store } = memoryStore();
    const flow = randomNonce();
    await holdPending(store, { userId: 'u1', flow }, t0);
    expect(
      await takePending(store, flow, later(PENDING_TTL_SECONDS))
    ).toBeNull();
  });

  it('refuse a forged row whose own time has passed', async () => {
    const { store } = memoryStore();
    const flow = randomNonce();
    await store.put(
      pendingIdentifier(flow),
      JSON.stringify({ userId: 'u1', createdAt: t0.toISOString() }),
      later(3600)
    );
    expect(
      await takePending(store, flow, later(PENDING_TTL_SECONDS + 1))
    ).toBeNull();
  });

  it('will not hold without a user or a well-formed flow', async () => {
    const { store } = memoryStore();
    await expect(
      holdPending(store, { userId: '', flow: randomNonce() })
    ).rejects.toThrow();
    await expect(
      holdPending(store, { userId: 'u1', flow: 'short' })
    ).rejects.toThrow();
    expect(await takePending(store, 'short')).toBeNull();
  });
});

describe('sameSecret', () => {
  it('compares exactly', () => {
    const a = randomNonce();
    expect(sameSecret(a, a)).toBe(true);
    expect(sameSecret(a, randomNonce())).toBe(false);
    expect(sameSecret(a, a.slice(0, -1))).toBe(false);
  });
});
