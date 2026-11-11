import { describe, expect, it } from 'vitest';

import {
  nativeAppCookie,
  nativeLaunchTarget,
  type LaunchRequest
} from './native-launch';

const launch = (
  over: Partial<Omit<LaunchRequest, 'header'>> = {},
  headers: Record<string, string> = {}
) =>
  nativeLaunchTarget({
    method: 'GET',
    pathname: '/',
    hasSession: true,
    isApp: true,
    header: (name) => headers[name] ?? null,
    ...over
  });

describe('nativeLaunchTarget', () => {
  it('sends a signed-in app launch at the home page to Today', () => {
    expect(launch()).toBe('/today');
    expect(launch({}, { 'sec-fetch-dest': 'document' })).toBe('/today');
  });

  it('leaves a phone browser on the home page', () => {
    expect(launch({ isApp: false })).toBeNull();
  });

  it('leaves the signed-out app on the home page', () => {
    expect(launch({ hasSession: false })).toBeNull();
  });

  it('only redirects the root', () => {
    expect(launch({ pathname: '/about' })).toBeNull();
    expect(launch({ pathname: '/my-sores' })).toBeNull();
  });

  it('keeps Home reachable from inside the app', () => {
    // A client navigation to Home is a fetch from the current page.
    expect(
      launch(
        {},
        { 'sec-fetch-dest': 'empty', referer: 'https://cankercore.com/today' }
      )
    ).toBeNull();
    // A full load of Home from another page carries a referrer.
    expect(launch({}, { referer: 'https://cankercore.com/today' })).toBeNull();
  });

  it('ignores anything that is not a document load', () => {
    expect(launch({ method: 'HEAD' })).toBeNull();
    expect(launch({}, { 'sec-fetch-dest': 'empty' })).toBeNull();
  });
});

describe('nativeAppCookie', () => {
  it('lasts a year, site-wide, and is secure on https', () => {
    expect(nativeAppCookie(true)).toBe(
      'native-app=1; path=/; max-age=31536000; samesite=lax; secure'
    );
    expect(nativeAppCookie(false)).not.toContain('secure');
  });
});
