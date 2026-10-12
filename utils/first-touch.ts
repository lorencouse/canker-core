/**
 * First-touch attribution for the signup funnel.
 *
 * The funnel itself (signup, onboarded, first reading, a reading on a second
 * day) is derived from rows the app already writes; see scripts/funnel.sql.
 * The one thing those rows cannot say is which page brought somebody in, so
 * the proxy drops a first-party cookie on a visitor's first request and the
 * auth hook copies it onto the account when one is created. No third-party
 * script, no pageview log: one cookie, one row per account.
 *
 * Only a pathname and a bare referrer host are kept. Query strings and full
 * referrer URLs are dropped because they are where other sites put email
 * addresses, tokens and search terms.
 */

export const FIRST_TOUCH_COOKIE = 'cc_first_touch';

// Long enough to cover reading an article on one visit and signing up on a
// later one, short enough not to outlive the question it answers.
export const FIRST_TOUCH_MAX_AGE = 60 * 60 * 24 * 90;

export type FirstTouch = {
  /** The pathname the visitor first landed on, e.g. `/blog/canker-sore-in-throat`. */
  path: string;
  /** Host of the external page that sent them, or null for direct or internal. */
  referrer: string | null;
  /** When the cookie was set. */
  at: Date;
};

const MAX_PATH = 200;
const MAX_HOST = 253;

function cleanPath(path: string): string | null {
  if (!path.startsWith('/')) return null;
  return path.slice(0, MAX_PATH);
}

/**
 * The referrer's host, if it is somewhere other than this site. A referrer of
 * our own host means the cookie was lost mid-visit, which is not a source.
 */
export function externalReferrerHost(
  referrer: string | null | undefined,
  ownHost: string
): string | null {
  if (!referrer) return null;
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host || host === ownHost.toLowerCase()) return null;
  return host.slice(0, MAX_HOST);
}

/** The cookie value before encoding; Next percent-encodes it when it sets it. */
export function encodeFirstTouch(touch: FirstTouch): string {
  return JSON.stringify({
    p: touch.path,
    r: touch.referrer,
    t: touch.at.getTime()
  });
}

/**
 * Takes the value as it arrives in a `Cookie` header, still percent-encoded.
 * The cookie is written by our own proxy but comes back from the browser, so
 * anything that does not parse into the expected shape is treated as absent.
 */
export function decodeFirstTouch(
  value: string | null | undefined
): FirstTouch | null {
  if (!value) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const { p, r, t } = raw as Record<string, unknown>;
  if (typeof p !== 'string' || typeof t !== 'number') return null;
  const path = cleanPath(p);
  const at = new Date(t);
  if (!path || Number.isNaN(at.getTime())) return null;
  const referrer = typeof r === 'string' && r ? r.slice(0, MAX_HOST) : null;
  return { path, referrer, at };
}

/** Reads one cookie out of a raw `Cookie` request header. */
export function readCookie(
  header: string | null | undefined,
  name: string
): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}
