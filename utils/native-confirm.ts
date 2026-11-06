/**
 * The page finish shows in the iOS sign-in sheet before it mints a handoff
 * token (utils/native-auth.ts has the flow). Any installed app can open a
 * sheet on /api/native-auth/start, and a returning Google or GitHub user
 * passes the provider without a screen, so this is the step that makes the
 * person say which app they are signing in to.
 *
 * A standalone document rather than a Next page: it is served from the
 * route handler that holds the flow cookie, which is scoped to
 * /api/native-auth, and it runs in the sheet, outside the app's shell.
 */
import type { NativeCallbackKind } from '@/utils/native-auth';

export type ConfirmPageInput = {
  email: string;
  nonce: string;
  next: string;
  callback: NativeCallbackKind;
  csrf: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Inline styles only: the response's CSP allows nothing else to load. */
const STYLE = `
  :root { color-scheme: light dark; --ink: #16163f; --paper: #ffffff; --brand: #4b4bf0; --line: #d8d8ee; }
  @media (prefers-color-scheme: dark) { :root { --ink: #f2f2ff; --paper: #16163f; --line: #3a3a6e; } }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 24px;
    font: 16px/1.5 -apple-system, system-ui, sans-serif; color: var(--ink); background: var(--paper); }
  main { width: 100%; max-width: 360px; display: grid; gap: 16px; }
  h1 { margin: 0; font-size: 20px; line-height: 1.3; text-wrap: balance; overflow-wrap: anywhere; }
  p { margin: 0; text-wrap: pretty; }
  form { display: grid; gap: 8px; }
  button { min-height: 44px; border-radius: 8px; font: inherit; font-weight: 600; white-space: nowrap; }
  .go { border: 0; background: var(--brand); color: #fff; }
  .stop { border: 1px solid var(--line); background: transparent; color: inherit; }
`;

export function confirmPage(input: ConfirmPageInput): string {
  const hidden = (name: string, value: string) =>
    `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>Continue to Canker Core</title>
<style>${STYLE}</style>
</head>
<body>
<main>
<h1>Continue to the Canker Core app as ${escapeHtml(input.email)}?</h1>
<p>Only continue if you started this sign-in in the Canker Core app.</p>
<form method="post" action="/api/native-auth/finish">
${hidden('csrf', input.csrf)}
${hidden('nonce', input.nonce)}
${hidden('next', input.next)}
${hidden('callback', input.callback)}
<button class="go" type="submit" name="action" value="continue">Continue</button>
<button class="stop" type="submit" name="action" value="cancel">Cancel</button>
</form>
</main>
</body>
</html>
`;
}

/** Headers for that page: never cached, never framed, nothing but itself. */
export const CONFIRM_PAGE_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Content-Security-Policy':
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  'X-Frame-Options': 'DENY'
} as const;
