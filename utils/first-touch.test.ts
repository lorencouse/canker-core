import { describe, expect, it } from 'vitest';

import {
  decodeFirstTouch,
  encodeFirstTouch,
  externalReferrerHost,
  readCookie
} from './first-touch';

describe('externalReferrerHost', () => {
  it('keeps only the host of an external referrer', () => {
    expect(
      externalReferrerHost(
        'https://www.google.com/search?q=canker+sore',
        'cankercore.com'
      )
    ).toBe('www.google.com');
  });

  it('drops our own host, empty values and garbage', () => {
    expect(
      externalReferrerHost('https://cankercore.com/blog', 'cankercore.com')
    ).toBeNull();
    expect(externalReferrerHost('', 'cankercore.com')).toBeNull();
    expect(externalReferrerHost(null, 'cankercore.com')).toBeNull();
    expect(externalReferrerHost('not a url', 'cankercore.com')).toBeNull();
  });
});

describe('first-touch cookie', () => {
  it('round-trips', () => {
    const touch = {
      path: '/blog/canker-sore-in-throat',
      referrer: 'www.bing.com',
      at: new Date('2026-10-12T09:00:00.000Z')
    };
    expect(
      decodeFirstTouch(encodeURIComponent(encodeFirstTouch(touch)))
    ).toEqual(touch);
  });

  it('treats anything malformed as absent', () => {
    expect(decodeFirstTouch(undefined)).toBeNull();
    expect(decodeFirstTouch('%7B')).toBeNull();
    expect(decodeFirstTouch(encodeURIComponent('"x"'))).toBeNull();
    expect(
      decodeFirstTouch(encodeURIComponent(JSON.stringify({ p: 'blog', t: 1 })))
    ).toBeNull();
    expect(
      decodeFirstTouch(encodeURIComponent(JSON.stringify({ p: '/', t: 'x' })))
    ).toBeNull();
  });

  it('caps what it will hand to the database', () => {
    const long = encodeURIComponent(
      JSON.stringify({ p: `/${'a'.repeat(500)}`, r: 'b'.repeat(500), t: 0 })
    );
    const touch = decodeFirstTouch(long);
    expect(touch?.path).toHaveLength(200);
    expect(touch?.referrer).toHaveLength(253);
  });
});

describe('readCookie', () => {
  it('finds one cookie among several', () => {
    expect(readCookie('a=1; cc_first_touch=xyz; b=2', 'cc_first_touch')).toBe(
      'xyz'
    );
    expect(readCookie('a=1', 'cc_first_touch')).toBeNull();
    expect(readCookie(null, 'cc_first_touch')).toBeNull();
  });
});
