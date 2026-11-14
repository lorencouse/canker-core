/**
 * Sign in with Apple: the configuration, the client secret, and the grant
 * kept so it can be revoked.
 *
 * Two Apple clients sign people in, and Apple scopes a person's tokens to the
 * one that issued them:
 *   - the website, through the Services ID (APPLE_CLIENT_ID), with Better
 *     Auth's ordinary redirect and a callback at /api/auth/callback/apple;
 *   - the iOS app, whose own Sign in with Apple sheet issues tokens to the
 *     app's bundle id (APPLE_APP_BUNDLE_ID, com.cankercore.app by default).
 * Both are grouped under the app's primary App ID, so one person has one
 * Apple subject in both and reaches the same account. The key
 * (APPLE_KEY_ID, APPLE_PRIVATE_KEY) belongs to that primary App ID, and signs
 * the client secret for either client.
 *
 * App Review wants an app that offers Sign in with Apple to revoke the
 * person's grant when they delete their account (guideline 5.1.1(v)), which
 * takes a refresh token. The website's flow gets one from Better Auth's code
 * exchange, kept on the `account` row; the app's sheet hands over an
 * authorization code beside its identity token, exchanged here
 * (keepAppleGrant). Both are best effort: a sign-in that cannot exchange its
 * code still signs in, and a deletion goes ahead whatever Apple says.
 */
import 'server-only';
import { createPrivateKey, sign } from 'node:crypto';
import { query } from '@/lib/db/pool';

export const APPLE_APP_BUNDLE_ID_DEFAULT = 'com.cankercore.app';

/** Apple refuses a client secret that lives longer than six months. */
const SECRET_LIFETIME_SECONDS = 60 * 60 * 24 * 180;
const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
const APPLE_TIMEOUT_MS = 5_000;

export type AppleConfig = {
  /** The Services ID: the website's client. */
  clientId: string;
  /** The iOS app's bundle id: the audience of the app sheet's tokens. */
  bundleId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
};

const env = (name: string, from: NodeJS.ProcessEnv) =>
  from[name]?.trim() || undefined;

/** Environment files often carry a PEM's line breaks as a literal \n. */
export function normalizePem(raw: string): string {
  return raw.replace(/\\n/g, '\n').trim() + '\n';
}

/**
 * The Apple configuration, or null when any part is missing or the key does
 * not parse. Null keeps the provider unregistered and the button hidden,
 * rather than a button that fails on every tap.
 */
export function appleConfig(
  from: NodeJS.ProcessEnv = process.env
): AppleConfig | null {
  const clientId = env('APPLE_CLIENT_ID', from);
  const teamId = env('APPLE_TEAM_ID', from);
  const keyId = env('APPLE_KEY_ID', from);
  const rawKey = env('APPLE_PRIVATE_KEY', from);
  if (!clientId || !teamId || !keyId || !rawKey) return null;
  const privateKey = normalizePem(rawKey);
  try {
    createPrivateKey(privateKey);
  } catch {
    console.error('APPLE_PRIVATE_KEY does not parse; Apple sign-in is off.');
    return null;
  }
  return {
    clientId,
    bundleId: env('APPLE_APP_BUNDLE_ID', from) ?? APPLE_APP_BUNDLE_ID_DEFAULT,
    teamId,
    keyId,
    privateKey
  };
}

const base64url = (value: string | Buffer) =>
  Buffer.from(value).toString('base64url');

/**
 * Sign in with Apple takes a short-lived ES256 JWT as its client secret,
 * signed with the .p8 key. Making it from the key means it never needs
 * renewing by hand.
 */
export function appleClientSecret(
  config: Pick<AppleConfig, 'teamId' | 'keyId' | 'privateKey'>,
  clientId: string,
  now = Math.floor(Date.now() / 1000)
): string {
  const header = base64url(
    JSON.stringify({ alg: 'ES256', kid: config.keyId, typ: 'JWT' })
  );
  const payload = base64url(
    JSON.stringify({
      iss: config.teamId,
      iat: now,
      exp: now + SECRET_LIFETIME_SECONDS,
      aud: 'https://appleid.apple.com',
      sub: clientId
    })
  );
  const signature = sign('sha256', Buffer.from(`${header}.${payload}`), {
    key: createPrivateKey(config.privateKey),
    dsaEncoding: 'ieee-p1363'
  });
  return `${header}.${payload}.${base64url(signature)}`;
}

const post = (
  url: string,
  config: AppleConfig,
  clientId: string,
  params: Record<string, string>
) =>
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: appleClientSecret(config, clientId),
      ...params
    }),
    signal: AbortSignal.timeout(APPLE_TIMEOUT_MS)
  });

/** The `sub` claim of a JWT, or null. */
export function jwtSubject(jwt: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(jwt.split('.')[1] ?? '', 'base64url').toString('utf8')
    ) as { sub?: unknown };
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

/**
 * Exchanges an authorization code from the app's Apple sheet for a refresh
 * token and files it on the user's Apple account row. Only a token issued
 * for the Apple subject already linked to this user is kept, so a code from
 * someone else's sheet cannot be filed under this account.
 */
export async function keepAppleGrant(
  userId: string,
  code: unknown,
  config: AppleConfig | null = appleConfig()
): Promise<boolean> {
  if (!config || typeof code !== 'string' || !code || code.length > 1024)
    return false;
  try {
    const res = await post(APPLE_TOKEN_URL, config, config.bundleId, {
      code,
      grant_type: 'authorization_code'
    });
    if (!res.ok) {
      console.error(`Apple code exchange refused (${res.status}).`);
      return false;
    }
    const body = (await res.json()) as {
      refresh_token?: unknown;
      id_token?: unknown;
    };
    if (
      typeof body.refresh_token !== 'string' ||
      typeof body.id_token !== 'string'
    )
      return false;
    // Straight from Apple's token endpoint over TLS, so the payload is read
    // without checking the signature.
    const sub = jwtSubject(body.id_token);
    if (!sub) return false;
    const updated = await query(
      `update "account" set "refreshToken" = $1, "updatedAt" = now()
       where "userId" = $2 and "providerId" = 'apple' and "accountId" = $3
       returning "id"`,
      [body.refresh_token, userId, sub]
    );
    return updated.length > 0;
  } catch (error) {
    console.error('Apple code exchange failed', error);
    return false;
  }
}

/**
 * Revokes every Apple grant this user holds. A token is scoped to the client
 * that issued it, and the row does not say which, so each is offered to the
 * website's client first and then the app's.
 */
export async function revokeAppleGrants(
  userId: string,
  config: AppleConfig | null = appleConfig()
): Promise<void> {
  if (!config) return;
  try {
    const rows = await query<{ refreshToken: string | null }>(
      `select "refreshToken" from "account"
       where "userId" = $1 and "providerId" = 'apple' and "refreshToken" is not null`,
      [userId]
    );
    for (const { refreshToken } of rows) {
      if (!refreshToken) continue;
      for (const clientId of [config.clientId, config.bundleId]) {
        const res = await post(APPLE_REVOKE_URL, config, clientId, {
          token: refreshToken,
          token_type_hint: 'refresh_token'
        });
        if (res.ok) break;
      }
    }
  } catch (error) {
    console.error('Apple grant revocation failed', error);
  }
}
