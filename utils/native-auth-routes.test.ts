import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { randomNonce } from './native-auth';
import { APP_LINK_HOST, APP_LINK_PATH } from './native-patches.mjs';
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
import { GET as redeem } from '@/app/api/native-auth/redeem/route';

// The route handlers, driven end to end with Better Auth stubbed out: what
// is under test is the handoff's own checks, not Better Auth's.
const api = vi.hoisted(() => ({
  signInSocial: vi.fn(),
  holdNativeHandoff: vi.fn(),
  mintNativeHandoff: vi.fn(),
  discardNativeHandoff: vi.fn(),
  redeemNativeHandoff: vi.fn()
}));
vi.mock('@/lib/auth', () => ({
  auth: { api, $context: Promise.resolve({ secret: 'test-secret' }) },
  configuredOAuthProviders: () => ['google', 'github']
}));

const ORIGIN = 'https://cankercore.com';
const SESSION_COOKIE = '__Secure-better-auth.session_token';

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
  api.holdNativeHandoff.mockResolvedValue({
    headers: new Headers({ 'Set-Cookie': `${SESSION_COOKIE}=; Max-Age=0` }),
    response: { email: 'a<b>@example.com' }
  });
  api.mintNativeHandoff.mockResolvedValue({ token: randomNonce() });
  api.discardNativeHandoff.mockResolvedValue({ ok: true });
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
  it('hands finish the nonce inside the OAuth state, and nothing else', async () => {
    const nonce = randomNonce();
    await start(
      request(
        `/api/native-auth/start?${new URLSearchParams({ provider: 'github', nonce, next: '/today' })}`
      )
    );
    const finish = new URL(
      api.signInSocial.mock.calls[0][0].body.callbackURL,
      ORIGIN
    );
    expect(finish.pathname).toBe('/api/native-auth/finish');
    expect(Object.fromEntries(finish.searchParams)).toEqual({
      nonce,
      next: '/today'
    });
  });

  // iOS and Android return through the same https link (a universal link,
  // an App Link); there is no callback kind for a client to choose, so a
  // parameter naming one, or a scheme, changes nothing.
  it.each([
    'android',
    'ios',
    'com.cankercore.app://auth/callback',
    'intent://auth/callback#Intent;scheme=com.cankercore.app;end'
  ])('starts the same flow whatever callback=%s says', async (callback) => {
    const nonce = randomNonce();
    const res = await start(
      request(
        `/api/native-auth/start?${new URLSearchParams({ provider: 'google', nonce, next: '/today', callback })}`
      )
    );
    expect(res.headers.get('location')).toMatch(
      /^https:\/\/accounts\.google\.com\//
    );
    const finish = new URL(
      api.signInSocial.mock.calls[0][0].body.callbackURL,
      ORIGIN
    );
    expect(Object.fromEntries(finish.searchParams)).toEqual({
      nonce,
      next: '/today'
    });
  });

  it('fails through the https callback, whatever the app asks for', async () => {
    const res = await start(
      request('/api/native-auth/start?provider=apple&callback=scheme')
    );
    expect(res.headers.get('location')).toBe(
      `${ORIGIN}/native-auth/callback?error=invalid_provider`
    );
  });
});

describe('finish', () => {
  const nonce = randomNonce();
  const flowCookie = `native_auth_flow=${nonce}`;
  const finishUrl = `/api/native-auth/finish?${new URLSearchParams({ nonce, next: '/insights' })}`;

  async function confirmForm() {
    const res = await finishGet(request(finishUrl, { cookie: flowCookie }));
    const html = await res.text();
    const field = (name: string) =>
      html.match(new RegExp(`name="${name}" value="([^"]*)"`))?.[1] ?? '';
    return {
      res,
      html,
      form: { csrf: field('csrf'), nonce: field('nonce'), next: field('next') }
    };
  }

  const post = (
    form: object,
    init: { cookie?: string; origin?: string } = {}
  ) =>
    finishPost(
      request('/api/native-auth/finish', {
        method: 'POST',
        cookie: flowCookie,
        origin: ORIGIN,
        ...init,
        form
      })
    );

  it('ends the sheet session before it asks, naming the account, escaped', async () => {
    const { res, html } = await confirmForm();
    expect(res.status).toBe(200);
    expect(api.holdNativeHandoff).toHaveBeenCalledWith(
      expect.objectContaining({ body: { flow: nonce } })
    );
    // The session cookie's clear reaches the sheet with the page itself.
    expect(setCookie(res, SESSION_COOKIE)).toBe('');
    expect(res.headers.get('content-type')).toMatch(/^text\/html/);
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(html).toContain(
      'Continue to the Canker Core app as a&lt;b&gt;@example.com?'
    );
    expect(html).not.toContain('a<b>@example.com');
    expect(api.mintNativeHandoff).not.toHaveBeenCalled();
  });

  /**
   * The Origin a WebKit browser puts on the confirmation form's POST to this
   * same origin: Fetch's "serializing a request origin" sends `null` for a
   * non-GET request from a document whose referrer policy is no-referrer,
   * and the document's policy is its meta referrer, else the header.
   */
  function originBrowserSends(res: Response, html: string): string {
    const meta = html.match(/<meta name="referrer" content="([^"]*)">/)?.[1];
    const policy = meta ?? res.headers.get('referrer-policy') ?? '';
    return policy === 'no-referrer' ? 'null' : ORIGIN;
  }

  it('accepts Continue with the Origin the sheet actually sends', async () => {
    const { res, html, form } = await confirmForm();
    expect(res.headers.get('referrer-policy')).toBe('same-origin');
    const posted = await post(
      { ...form, action: 'continue' },
      { origin: originBrowserSends(res, html) }
    );
    expect(posted.status).toBe(303);
    expect(api.mintNativeHandoff).toHaveBeenCalled();
  });

  it('refuses a GET without the flow cookie, holding nothing', async () => {
    const res = await finishGet(request(finishUrl));
    expect(res.headers.get('location')).toBe(
      `${ORIGIN}/native-auth/callback?error=invalid_request`
    );
    expect(api.holdNativeHandoff).not.toHaveBeenCalled();
  });

  it('reports a sheet with no session', async () => {
    api.holdNativeHandoff.mockRejectedValueOnce(new Error('401'));
    const { res } = await confirmForm();
    expect(res.headers.get('location')).toBe(
      `${ORIGIN}/native-auth/callback?error=no_session`
    );
  });

  it('mints from the pending handoff on Continue, through the universal link', async () => {
    const { form } = await confirmForm();
    const res = await post({ ...form, action: 'continue' });
    expect(res.status).toBe(303);
    expect(api.mintNativeHandoff).toHaveBeenCalledWith({
      body: { flow: nonce }
    });
    const location = new URL(res.headers.get('location')!);
    expect(location.origin + location.pathname).toBe(
      `${ORIGIN}/native-auth/callback`
    );
    const { token } = await api.mintNativeHandoff.mock.results[0].value;
    expect(location.searchParams.get('token')).toBe(token);
    expect(location.searchParams.get('next')).toBe('/insights');
  });

  it.each(['scheme', 'android', 'com.cankercore.app://auth/callback'])(
    'never redirects to a custom scheme, whatever callback=%s says',
    async (callback) => {
      const { form } = await confirmForm();
      const res = await post({ ...form, callback, action: 'continue' });
      expect(res.headers.get('location')).toMatch(
        /^https:\/\/cankercore\.com\/native-auth\/callback\?token=/
      );
    }
  );

  it('redirects Continue to the App Link path the Android app claims', async () => {
    const { form } = await confirmForm();
    const res = await post({ ...form, action: 'continue' });
    const location = new URL(res.headers.get('location')!);
    expect(location.protocol).toBe('https:');
    expect(location.host).toBe(APP_LINK_HOST);
    expect(location.port).toBe('');
    expect(location.pathname).toBe(APP_LINK_PATH);
  });

  it('reports an expired or already-answered confirmation', async () => {
    api.mintNativeHandoff.mockRejectedValueOnce({
      body: { message: 'expired_token' }
    });
    const { form } = await confirmForm();
    const res = await post({ ...form, action: 'continue' });
    expect(res.headers.get('location')).toBe(
      `${ORIGIN}/native-auth/callback?error=expired_token`
    );
  });

  it('discards the pending handoff on Cancel and mints nothing', async () => {
    const { form } = await confirmForm();
    const res = await post({ ...form, action: 'cancel' });
    expect(api.discardNativeHandoff).toHaveBeenCalledWith({
      body: { flow: nonce }
    });
    expect(api.mintNativeHandoff).not.toHaveBeenCalled();
    expect(res.headers.get('location')).toBe(
      `${ORIGIN}/native-auth/callback?error=cancelled`
    );
  });

  it.each([
    ['a cross-site post', { origin: 'https://evil.com' }, {}],
    ['a post with no origin', { origin: undefined }, {}],
    ['a post with an opaque origin', { origin: 'null' }, {}],
    ['a forged csrf token', {}, { csrf: 'x'.repeat(43) }],
    ['a csrf token from another flow', {}, { nonce: randomNonce() }],
    ['no flow cookie', { cookie: undefined }, {}]
  ])('refuses %s', async (_name, headerOverrides, formOverrides) => {
    const { form } = await confirmForm();
    const res = await post(
      { ...form, action: 'continue', ...formOverrides },
      headerOverrides
    );
    expect(res.status).toBe(403);
    expect(api.mintNativeHandoff).not.toHaveBeenCalled();
    expect(api.discardNativeHandoff).not.toHaveBeenCalled();
  });
});

describe('redeem', () => {
  // The standalone server binds 0.0.0.0:3000, so request.url carries that
  // rather than the host the webview loaded.
  function internalRequest(path: string) {
    return new NextRequest(new URL(path, 'http://0.0.0.0:3000'), {
      headers: { host: 'cankercore.com', 'x-forwarded-proto': 'https' }
    });
  }

  it('sends a signed-in webview on to next on the public origin', async () => {
    api.redeemNativeHandoff.mockResolvedValueOnce({ headers: new Headers() });
    const res = await redeem(
      internalRequest('/api/native-auth/redeem?token=t&next=%2Fmap')
    );
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('https://cankercore.com/map');
  });

  it('lands a failed redeem on the public sign-in page', async () => {
    api.redeemNativeHandoff.mockRejectedValueOnce({
      body: { message: 'expired_token' }
    });
    const res = await redeem(internalRequest('/api/native-auth/redeem?token=t'));
    const location = new URL(res.headers.get('location')!);
    expect(location.origin).toBe(ORIGIN);
    expect(location.pathname).toBe('/signin/password_signin');
  });
});
