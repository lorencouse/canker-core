/**
 * Handoff tokens for the iOS system sign-in (see utils/native-auth.ts).
 *
 * A handoff token stands in for a sign-in for one minute, once. It never
 * carries the session token itself: redemption creates a new session for the
 * user, so the session cookie only ever travels as a cookie.
 *
 *   - 256 random bits, base64url.
 *   - Stored as its SHA-256 only, so the table holds nothing redeemable and
 *     the lookup is an exact match on a hash rather than a comparison of
 *     secrets an attacker could time.
 *   - Taken with an atomic delete, so a second redemption finds nothing.
 *   - Bound to the nonce of the webview that started the flow, compared in
 *     constant time. A mismatch still burns the token.
 *
 * Storage is behind HandoffStore so the rules are testable without Postgres;
 * lib/native-handoff-plugin.ts backs it with Better Auth's verification table.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { isRandom32 } from '@/utils/native-auth';

export const HANDOFF_TTL_SECONDS = 60;

const IDENTIFIER_PREFIX = 'native-handoff:';

export interface HandoffStore {
  put(identifier: string, value: string, expiresAt: Date): Promise<void>;
  /** Atomically fetch and delete. Null when there is nothing to take. */
  take(identifier: string): Promise<{ value: string; expiresAt: Date } | null>;
}

export type RedeemResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'invalid_token' | 'expired_token' | 'wrong_device' };

const sha256 = (value: string) => createHash('sha256').update(value).digest();

export const handoffIdentifier = (token: string) =>
  IDENTIFIER_PREFIX + sha256(token).toString('base64url');

export async function mintHandoff(
  store: HandoffStore,
  { userId, nonce }: { userId: string; nonce: string },
  now: Date = new Date()
): Promise<string> {
  if (!userId) throw new Error('mintHandoff: userId is required');
  if (!isRandom32(nonce)) throw new Error('mintHandoff: malformed nonce');
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + HANDOFF_TTL_SECONDS * 1000);
  const value = JSON.stringify({
    userId,
    nonceHash: sha256(nonce).toString('base64url'),
    expiresAt: expiresAt.toISOString()
  });
  await store.put(handoffIdentifier(token), value, expiresAt);
  return token;
}

export async function redeemHandoff(
  store: HandoffStore,
  { token, nonce }: { token: unknown; nonce: unknown },
  now: Date = new Date()
): Promise<RedeemResult> {
  if (!isRandom32(token)) return { ok: false, reason: 'invalid_token' };

  // Taken before anything else is checked, so every presented token is
  // spent whether or not the rest of the request is right.
  const row = await store.take(handoffIdentifier(token));
  if (!row) return { ok: false, reason: 'invalid_token' };

  let data: { userId?: unknown; nonceHash?: unknown; expiresAt?: unknown };
  try {
    data = JSON.parse(row.value);
  } catch {
    return { ok: false, reason: 'invalid_token' };
  }
  if (typeof data.userId !== 'string' || typeof data.nonceHash !== 'string')
    return { ok: false, reason: 'invalid_token' };

  // The row's own expiry and the one sealed in the value must both hold, so
  // a store that forgets to enforce expiry still cannot stretch the window.
  const sealed = new Date(String(data.expiresAt)).getTime();
  if (!(row.expiresAt.getTime() > now.getTime()) || !(sealed > now.getTime()))
    return { ok: false, reason: 'expired_token' };

  if (!isRandom32(nonce)) return { ok: false, reason: 'wrong_device' };
  const expected = Buffer.from(data.nonceHash, 'base64url');
  const presented = sha256(nonce);
  if (
    expected.length !== presented.length ||
    !timingSafeEqual(expected, presented)
  )
    return { ok: false, reason: 'wrong_device' };

  return { ok: true, userId: data.userId };
}

/** Constant-time equality for two short strings (the flow cookie check). */
export function sameSecret(a: string, b: string): boolean {
  const x = sha256(a);
  const y = sha256(b);
  return timingSafeEqual(x, y);
}
