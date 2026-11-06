import { describe, expect, it } from 'vitest';

import {
  readTimeZoneCookie,
  timeZoneCookie,
  TIME_ZONE_COOKIE
} from './time-zone-cookie';

describe('time zone cookie', () => {
  it('round-trips a zone through a cookie string', () => {
    const pair = timeZoneCookie('America/Los_Angeles').split(';')[0];
    expect(pair.startsWith(`${TIME_ZONE_COOKIE}=`)).toBe(true);
    expect(readTimeZoneCookie(`theme=dark; ${pair}`)).toBe(
      'America/Los_Angeles'
    );
  });

  it('is missing when no tz cookie is set', () => {
    expect(readTimeZoneCookie('')).toBeNull();
    expect(readTimeZoneCookie('tzx=Asia/Kolkata')).toBeNull();
  });
});
