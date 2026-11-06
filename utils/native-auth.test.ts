import { describe, expect, it } from 'vitest';
import {
  NATIVE_AUTH_HTTPS_PATH,
  errorCode,
  isRandom32,
  nativeCallbackUrl,
  parseCallbackKind,
  parseNativeCallback,
  parseProvider,
  randomNonce
} from './native-auth';
import { DEFAULT_AFTER_SIGN_IN, safeNext } from './auth-helpers/settings';

describe('parseProvider', () => {
  it('accepts only the two configured providers', () => {
    expect(parseProvider('google')).toBe('google');
    expect(parseProvider('github')).toBe('github');
    for (const raw of ['apple', 'Google', ' google', '', null, undefined, 1])
      expect(parseProvider(raw)).toBeNull();
  });
});

describe('safeNext', () => {
  it('keeps in-app paths', () => {
    expect(safeNext('/today')).toBe('/today');
    expect(safeNext('/insights?range=30')).toBe('/insights?range=30');
  });

  it.each([
    'https://evil.com',
    'http://evil.com/today',
    '//evil.com',
    '/\\evil.com',
    '\\\\evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    'javascript:alert(1)',
    'com.cankercore.app://auth/callback',
    'today',
    '/signin/password_signin',
    '',
    null,
    undefined,
    '/' + 'a'.repeat(600)
  ])('rejects %j', (raw) => {
    expect(safeNext(raw)).toBe(DEFAULT_AFTER_SIGN_IN);
  });
});

describe('nonces', () => {
  it('are 256-bit base64url and distinct', () => {
    const a = randomNonce();
    expect(isRandom32(a)).toBe(true);
    expect(a).not.toBe(randomNonce());
  });

  it('reject anything else', () => {
    for (const raw of ['', 'abc', 'a'.repeat(44), 'a'.repeat(42) + '=', null])
      expect(isRandom32(raw)).toBe(false);
  });
});

describe('the callback URL', () => {
  const token = randomNonce();
  const origin = 'https://cankercore.com';
  const scheme = { kind: 'scheme', origin } as const;
  const https = { kind: 'https', origin } as const;

  it('round-trips a token and next through the custom scheme', () => {
    const url = nativeCallbackUrl({ token, next: '/map?x=1&y=2' }, scheme);
    expect(url.startsWith('com.cankercore.app://auth/callback?')).toBe(true);
    expect(parseNativeCallback(url, origin)).toEqual({
      token,
      next: '/map?x=1&y=2'
    });
  });

  it('round-trips a token and next through the universal link', () => {
    const url = nativeCallbackUrl({ token, next: '/today' }, https);
    expect(url.startsWith('https://cankercore.com/native-auth/callback?')).toBe(
      true
    );
    expect(parseNativeCallback(url, origin)).toEqual({ token, next: '/today' });
  });

  it('round-trips an error, flattened to a safe code', () => {
    for (const callback of [scheme, https]) {
      expect(
        parseNativeCallback(
          nativeCallbackUrl({ error: 'access_denied' }, callback),
          origin
        )
      ).toEqual({ error: 'access_denied' });
      expect(
        parseNativeCallback(
          nativeCallbackUrl({ error: '<script>' }, callback),
          origin
        )
      ).toEqual({ error: 'unknown' });
    }
  });

  it('ignores URLs that are not our callback', () => {
    for (const raw of [
      `https://cankercore.com/auth/callback?token=${token}`,
      `https://evil.com/native-auth/callback?token=${token}`,
      `http://cankercore.com/native-auth/callback?token=${token}`,
      `com.cankercore.app://evil/callback?token=${token}`,
      `com.cankercore.app://auth/other?token=${token}`,
      `other.app://auth/callback?token=${token}`,
      'not a url'
    ])
      expect(parseNativeCallback(raw, origin)).toBeNull();
  });

  it('flags a malformed token', () => {
    expect(
      parseNativeCallback(
        'com.cankercore.app://auth/callback?token=abc',
        origin
      )
    ).toEqual({ error: 'invalid_token' });
  });
});

describe('parseCallbackKind', () => {
  it('is https only when asked for exactly', () => {
    expect(parseCallbackKind('https')).toBe('https');
    for (const raw of ['scheme', 'HTTPS', '', null, undefined])
      expect(parseCallbackKind(raw)).toBe('scheme');
  });
});

describe('errorCode', () => {
  it('keeps short identifiers and flattens the rest', () => {
    expect(errorCode('no_session')).toBe('no_session');
    expect(errorCode('Access_Denied')).toBe('access_denied');
    expect(errorCode('a b')).toBe('unknown');
    expect(errorCode(undefined)).toBe('unknown');
  });
});

describe('apple-app-site-association', () => {
  it('hands the https callback to this app and only this app', async () => {
    const { readFile } = await import('node:fs/promises');
    const aasa = JSON.parse(
      await readFile(
        new URL(
          '../public/.well-known/apple-app-site-association',
          import.meta.url
        ),
        'utf8'
      )
    ) as {
      applinks: {
        details: { appIDs: string[]; components: { '/': string }[] }[];
      };
      webcredentials: { apps: string[] };
    };
    const app = '4J28Z4QS4C.com.cankercore.app';
    const claiming = aasa.applinks.details.filter((d) =>
      d.components.some((c) => c['/'] === NATIVE_AUTH_HTTPS_PATH)
    );
    expect(claiming.flatMap((d) => d.appIDs)).toEqual([app]);
    expect(aasa.webcredentials.apps).toEqual([app]);
  });
});
