import { generateKeyPairSync, verify } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const db = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/lib/db/pool', () => db);

import {
  APPLE_APP_BUNDLE_ID_DEFAULT,
  appleClientSecret,
  appleConfig,
  jwtSubject,
  keepAppleGrant,
  revokeAppleGrants
} from '@/lib/apple';

const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256'
});
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

const ENV = {
  APPLE_CLIENT_ID: 'com.cankercore.signin',
  APPLE_TEAM_ID: 'TEAM123456',
  APPLE_KEY_ID: 'KEY1234567',
  // As Coolify holds it: one line, the line breaks written as \n.
  APPLE_PRIVATE_KEY: PEM.trim().replace(/\n/g, '\\n')
} as unknown as NodeJS.ProcessEnv;

const part = (jwt: string, i: number) =>
  JSON.parse(Buffer.from(jwt.split('.')[i], 'base64url').toString('utf8'));

const jwtFor = (claims: object) =>
  `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.sig`;

describe('appleConfig', () => {
  it('reads the four values and defaults the bundle id', () => {
    const config = appleConfig(ENV);
    expect(config).toMatchObject({
      clientId: 'com.cankercore.signin',
      bundleId: APPLE_APP_BUNDLE_ID_DEFAULT,
      teamId: 'TEAM123456',
      keyId: 'KEY1234567'
    });
    expect(config?.privateKey).toContain('\n');
  });

  it('is off when any value is missing or the key does not parse', () => {
    for (const name of Object.keys(ENV))
      expect(appleConfig({ ...ENV, [name]: '' })).toBeNull();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(appleConfig({ ...ENV, APPLE_PRIVATE_KEY: 'not a key' })).toBeNull();
    errors.mockRestore();
  });
});

describe('appleClientSecret', () => {
  it('is an ES256 JWT Apple accepts, signed by the key', () => {
    const config = appleConfig(ENV)!;
    const jwt = appleClientSecret(config, config.clientId, 1_000_000);
    expect(part(jwt, 0)).toEqual({
      alg: 'ES256',
      kid: 'KEY1234567',
      typ: 'JWT'
    });
    expect(part(jwt, 1)).toEqual({
      iss: 'TEAM123456',
      iat: 1_000_000,
      exp: 1_000_000 + 60 * 60 * 24 * 180,
      aud: 'https://appleid.apple.com',
      sub: 'com.cankercore.signin'
    });
    const [h, p, s] = jwt.split('.');
    expect(
      verify(
        'sha256',
        Buffer.from(`${h}.${p}`),
        { key: publicKey, dsaEncoding: 'ieee-p1363' },
        Buffer.from(s, 'base64url')
      )
    ).toBe(true);
  });
});

describe('jwtSubject', () => {
  it('reads sub, and nothing from junk', () => {
    expect(jwtSubject(jwtFor({ sub: 'abc' }))).toBe('abc');
    expect(jwtSubject(jwtFor({}))).toBeNull();
    expect(jwtSubject('junk')).toBeNull();
  });
});

describe('keepAppleGrant and revokeAppleGrants', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    db.query.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it("files the refresh token under the user's own Apple subject", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          refresh_token: 'r1',
          id_token: jwtFor({ sub: 'apple-sub' })
        })
      )
    );
    db.query.mockResolvedValue([{ id: 'a' }]);
    expect(await keepAppleGrant('user-1', 'code', appleConfig(ENV))).toBe(true);
    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body);
    // The sheet's code was issued to the app, so the app is the client.
    expect(body.get('client_id')).toBe(APPLE_APP_BUNDLE_ID_DEFAULT);
    expect(body.get('code')).toBe('code');
    expect(db.query.mock.calls[0][1]).toEqual(['r1', 'user-1', 'apple-sub']);
  });

  it('keeps nothing without a code or when Apple refuses', async () => {
    expect(await keepAppleGrant('user-1', '', appleConfig(ENV))).toBe(false);
    expect(await keepAppleGrant('user-1', 'c', null)).toBe(false);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response('{}', { status: 400 }));
    expect(await keepAppleGrant('user-1', 'c', appleConfig(ENV))).toBe(false);
    errors.mockRestore();
    expect(db.query).not.toHaveBeenCalled();
  });

  it('revokes with the website client, then the app', async () => {
    db.query.mockResolvedValue([{ refreshToken: 'r1' }]);
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 400 }))
      .mockResolvedValueOnce(new Response('', { status: 200 }));
    await revokeAppleGrants('user-1', appleConfig(ENV));
    const clients = fetchMock.mock.calls.map((c) =>
      new URLSearchParams(c[1].body).get('client_id')
    );
    expect(clients).toEqual([
      'com.cankercore.signin',
      APPLE_APP_BUNDLE_ID_DEFAULT
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://appleid.apple.com/auth/revoke'
    );
  });
});
