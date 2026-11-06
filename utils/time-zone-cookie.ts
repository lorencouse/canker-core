/**
 * The device's IANA zone, remembered so the server can draw Today's
 * placeholder on the device's own day. Functional only: it holds the zone
 * name and nothing that tells one visitor from another.
 */
export const TIME_ZONE_COOKIE = 'tz';

const ONE_YEAR = 60 * 60 * 24 * 365;

/** A `document.cookie` assignment that stores `timeZone`. */
export const timeZoneCookie = (timeZone: string): string =>
  `${TIME_ZONE_COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=${ONE_YEAR}; samesite=lax`;

/** The stored zone in a `document.cookie` string, or null. */
export const readTimeZoneCookie = (cookies: string): string | null => {
  const prefix = `${TIME_ZONE_COOKIE}=`;
  const pair = cookies
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(prefix));
  return pair === undefined
    ? null
    : decodeURIComponent(pair.slice(prefix.length));
};
