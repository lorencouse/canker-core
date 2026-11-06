import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { randomNonce } from './native-auth';
import {
  FIRST_TOUCH_COOKIE,
  decodeFirstTouch,
  encodeFirstTouch
} from './first-touch';
import { GET as start } from '@/app/api/native-auth/start/route';
import { GET as firstTouch } from '@/app/api/native-auth/first-touch/route';
import {
  GET as finishGet,
  POST as finishPost
} from '@/app/api/native-auth/finish/route';

// The route handlers, driven end to end with Better Auth stubbed out: what
// is under test is the handoff's own checks, not Better Auth's.
const api = vi.hoisted(() => ({
  signInSocial: vi.fn(),
  getSession: vi.fn(),
  mintNativeHandoff: vi.fn(),
  signOut: vi.fn()
}));
vi.mock('@/lib/auth', () => ({
  auth: { api, $context: Promise.resolve({ secret: 'test-secret' }) },
  configuredOAuthProviders: () => ['google', 'github']
}));

const ORIGIN = 'https://cankercore.com';

function request(
  path: string,
  init: {
    cookie?: string;
    method?: string;
    origin?: string;
    form?: object;
  } = {}
) {
  const headers: Record<string, string> = {
    host: 'cankercore.com',
    'x-forwarded-proto': 'https'
  };
  if (init.cookie) headers.cookie = init.cookie;
  if (init.origin) headers.origin = init.origin;
  if (init.form) headers['content-type'] = 'application/x-www-form-urlencoded';
  return new NextRequest(new URL(path, ORIGIN), {
    method: init.method ?? 'GET',
    headers,
    body: init.form
      ? new URLSearchParams(init.form as Record<string, string>).toString()
      : undefined
  });
}

/** Set-Cookie value for `name` on a response, still percent-encoded. */
function setCookie(res: Response, name: string): string | null {
  for (const cookie of res.headers.getSetCookie()) {
    if (cookie.startsWith(`${name}=`))
      return cookie.slice(name.length + 1).split(';')[0];
  }
  return null;
}

beforeEach(() => {
  vi.clearAllMocks();
  api.signInSocial.mockResolvedValue({
    headers: new Headers(),
    response: { url: 'https://accounts.google.com/o/oauth2/auth?state=x' }
  });
  api.getSession.mockResolvedValue({
    user: { id: 'u1', email: 'a<b>@example.com' },
    session: { token: 's' }
  });
  api.mintNativeHandoff.mockResolvedValue({
    headers: new Headers(),
    response: { token: randomNonce() }
  });
  api.signOut.mockResolvedValue({ headers: new Headers(), response: {} });
});

describe('first touch across the sign-in sheet', () => {
  const touch = {
    path: '/blog/canker%20sore',
    referrer: 'www.google.com',
    at: new Date('2026-10-01T00:00:00Z')
  };

  it('carries the webview cookie into the sheet for the signup hook', async () => {
    const cookie = `${FIRST_TOUCH_COOKIE}=${encodeURIComponent(encodeFirstTouch(touch))}`;
    const { firstTouch: ft } = await (
      await firstTouch(request('/api/native-auth/first-touch', { cookie }))
    ).json();
    expect(typeof ft).toBe('string');

    const nonce = randomNonce();
    const res = await start(
      request(
        `/api/native-auth/start?${new URLSearchParams({ provider: 'google', nonce, ft })}`
      )
    );
    expect(res.status).toBe(302);
    // Exactly what lib/auth.ts's user.create hook will read in the sheet.
    expect(decodeFirstTouch(setCookie(res, FIRST_TOUCH_COOKIE))).toEqual(touch);
  });

  it('sets nothing for a missing or forged value', async () => {
    expect(
      (await (await firstTouch(request('/api/native-auth/first-touch'))).json())
        .firstTouch
    ).toBeNull();
    for (const ft of ['', '{"p":"no-slash","t":1}', 'garbage']) {
      const res = await start(
        request(
          `/api/native-auth/start?${new URLSearchParams({ provider: 'google', nonce: randomNonce(), ft })}`
        )
      );
      expect(setCookie(res, FIRST_TOUCH_COOKIE)).toBeNull();
    }
  });
});

describe('start', () => {
  it('sends the callback kind on to finish inside the OAuth state', async () => {
    const nonce = randomNonce();
    await start(
      request(
        `/api/native-auth/start?${new URLSearchParams({ provider: 'github', nonce, callback: 'https' })}`
      )
    );
    const finish = new URL(
      api.signInSocial.mock.calls[0][0].body.callbackURL,
      ORIGIN
    );
    expect(finish.pathname).toBe('/api/native-auth/finish');
    expect(finish.searchParams.get('callback')).toBe('https');
    expect(finish.searchParams.get('nonce')).toBe(nonce);
  });

  it('fails through the callback the app asked for', async () => {
    const res = await start(
      request('/api/native-auth/start?provider=apple&callback=https')
    );
    expect(res.headers.get('location')).toBe(
      `${ORIGIN}/native-auth/callback?error=invalid_provider`
    );
  });
});

describe('finish', () => {
  const nonce = randomNonce();
  const flowCookie = `native_auth_flow=${nonce}`;
  const finishUrl = `/api/native-auth/finish?${new URLSearchParams({ nonce, next: '/insights', callback: 'https' })}`;

  async function confirmForm() {
    const res = await finishGet(request(finishUrl, { cookie: flowCookie }));
    const html = await res.text();
    const field = (name: string) =>
      html.match(new RegExp(`name="${name}" value="([^"]*)"`))?.[1] ?? '';
    return {
      res,
      html,
      form: {
        csrf: field('csrf'),
        nonce: field('nonce'),
        next: field('next'),
        callback: field('callback')
      }
    };
  }

  it('asks before it mints, naming the account, escaped', async () => {
    const { res, html } = await confirmForm();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/^text\/html/);
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(html).toContain(
      'Continue to the Canker Core app as a&lt;b&gt;@example.com?'
    );
    expect(html).not.toContain('a<b>@example.com');
    expect(api.mintNativeHandoff).not.toHaveBeenCalled();
  });

  it('refuses a GET without the flow cookie, minting nothing', async () => {
    const res = await finishGet(request(finishUrl));
    expect(res.headers.get('location')).toBe(
      `${ORIGIN}/native-auth/callback?error=invalid_request`
    );
    expect(api.getSession).not.toHaveBeenCalled();
  });

  it('mints on Continue and returns through the universal link', async () => {
    const { form } = await confirmForm();
    const res = await finishPost(
      request('/api/native-auth/finish', {
        method: 'POST',
        cookie: flowCookie,
        origin: ORIGIN,
        form: { ...form, action: 'continue' }
      })
    );
    expect(res.status).toBe(303);
    expect(api.mintNativeHandoff).toHaveBeenCalledWith(
      expect.objectContaining({ body: { nonce } })
    );
    const location = new URL(res.headers.get('location')!);
    expect(location.origin + location.pathname).toBe(
      `${ORIGIN}/native-auth/callback`
    );
    const { token } = (await api.mintNativeHandoff.mock.results[0].value)
      .response;
    expect(location.searchParams.get('token')).toBe(token);
    expect(location.searchParams.get('next')).toBe('/insights');
  });

  it('uses the custom scheme when the app cannot catch https', async () => {
    const { form } = await confirmForm();
    const res = await finishPost(
      request('/api/native-auth/finish', {
        method: 'POST',
        cookie: flowCookie,
        origin: ORIGIN,
        form: { ...form, callback: 'scheme', action: 'continue' }
      })
    );
    expect(res.headers.get('location')).toMatch(
      /^com\.cankercore\.app:\/\/auth\/callback\?token=/
    );
  });

  it('signs the sheet out on Cancel and mints nothing', async () => {
    const { form } = await confirmForm();
    const res = await finishPost(
      request('/api/native-auth/finish', {
        method: 'POST',
        cookie: flowCookie,
        origin: ORIGIN,
        form: { ...form, action: 'cancel' }
      })
    );
    expect(api.signOut).toHaveBeenCalled();
    expect(api.mintNativeHandoff).not.toHaveBeenCalled();
    expect(res.headers.get('location')).toBe(
      `${ORIGIN}/native-auth/callback?error=cancelled`
    );
  });

  it.each([
    ['a cross-site post', { origin: 'https://evil.com' }, {}],
    ['a post with no origin', { origin: undefined }, {}],
    ['a forged csrf token', {}, { csrf: 'x'.repeat(43) }],
    ['a csrf token from another flow', {}, { nonce: randomNonce() }],
    ['no flow cookie', { cookie: undefined }, {}]
  ])('refuses %s', async (_name, headerOverrides, formOverrides) => {
    const { form } = await confirmForm();
    const res = await finishPost(
      request('/api/native-auth/finish', {
        method: 'POST',
        cookie: flowCookie,
        origin: ORIGIN,
        ...headerOverrides,
        form: { ...form, action: 'continue', ...formOverrides }
      })
    );
    expect(res.status).toBe(403);
    expect(api.mintNativeHandoff).not.toHaveBeenCalled();
  });
});
