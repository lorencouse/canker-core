'use client';

import { authClient } from '@/lib/auth-client';
import { redirectToPath } from './server';
import { safeNext } from './settings';
import { hasSystemSignIn, systemSignIn } from '@/utils/native';
import {
  NATIVE_AUTH_COOKIE_PATH,
  NATIVE_AUTH_FLOW_MAX_AGE,
  NATIVE_AUTH_HTTPS_PATH,
  NATIVE_AUTH_NONCE_COOKIE,
  nativeAuthErrorMessage,
  parseNativeCallback,
  randomNonce
} from '@/utils/native-auth';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export type OAuthProvider = 'github' | 'google';

export async function handleRequest(
  e: React.FormEvent<HTMLFormElement>,
  requestFunc: (formData: FormData) => Promise<string>,
  router: AppRouterInstance | null = null
): Promise<boolean | void> {
  // Prevent default form submission refresh
  e.preventDefault();

  const formData = new FormData(e.currentTarget);
  const redirectUrl: string = await requestFunc(formData);

  if (router) {
    // If client-side router is provided, use it to redirect
    router.push(redirectUrl);
    // The session cookie is set on the auth response, so the server components
    // for the destination must be re-fetched rather than served from the
    // client-side router cache.
    return router.refresh();
  } else {
    // Otherwise, redirect server-side
    return await redirectToPath(redirectUrl);
  }
}

/**
 * Start an OAuth sign-in. Resolves with a message to show when it could not
 * start, and with null when it is under way or was cancelled.
 *
 * In a browser this is Better Auth's ordinary redirect, with the callback at
 * /api/auth/callback/<provider>, and so it is in an app that cannot catch the
 * https callback (iOS before 17.4; Android with no Custom Tabs browser or an
 * unverified App Link). Otherwise the app runs it in the system sign-in:
 * Apple's sign-in sheet on iOS, a Custom Tab on Android; see
 * utils/native-auth.ts.
 */
export async function signInWithOAuth(
  e: React.FormEvent<HTMLFormElement>
): Promise<string | null> {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const provider = String(formData.get('provider')).trim() as OAuthProvider;
  const next = safeNext(formData.get('next'));

  if (await hasSystemSignIn(NATIVE_AUTH_HTTPS_PATH))
    return signInWithSystemSheet(provider, next);

  // signIn.social reports failure in its result rather than throwing; left
  // unread, a server error made the button silently do nothing.
  const { error } = await authClient.signIn.social({
    provider,
    callbackURL: next,
    errorCallbackURL: '/signin'
  });
  return error ? OAUTH_START_FAILED : null;
}

const OAUTH_START_FAILED =
  'That sign-in option is not available right now. Try another way to sign in.';

async function signInWithSystemSheet(
  provider: OAuthProvider,
  next: string
): Promise<string | null> {
  // Only this webview holds the nonce, and redeem refuses a token minted for
  // any other, so a token that leaks or is replayed elsewhere signs no one in.
  const nonce = randomNonce();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${NATIVE_AUTH_NONCE_COOKIE}=${nonce}; Path=${NATIVE_AUTH_COOKIE_PATH}; ` +
    `Max-Age=${NATIVE_AUTH_FLOW_MAX_AGE}; SameSite=Strict${secure}`;

  const firstTouch = await webviewFirstTouch();
  const start = new URL('/api/native-auth/start', window.location.origin);
  start.search = new URLSearchParams({
    provider,
    next,
    nonce,
    ...(firstTouch && { ft: firstTouch })
  }).toString();

  let callback: string;
  try {
    ({ url: callback } = await systemSignIn(
      start.href,
      NATIVE_AUTH_HTTPS_PATH
    ));
  } catch (err) {
    // Closing the sheet or tab is a choice, not an error: stay put, say nothing.
    if ((err as { code?: string })?.code === 'CANCELED') return null;
    return nativeAuthErrorMessage('unknown');
  }

  const result = parseNativeCallback(callback, window.location.origin);
  if (!result) return nativeAuthErrorMessage('unknown');
  // Cancel on finish's confirmation page is a choice too.
  if ('error' in result)
    return result.error === 'cancelled'
      ? null
      : nativeAuthErrorMessage(result.error);

  const redeem = new URL('/api/native-auth/redeem', window.location.origin);
  redeem.search = new URLSearchParams({
    token: result.token,
    next: safeNext(result.next)
  }).toString();
  // A full navigation, so the session cookie redeem sets is in place before
  // any server component renders.
  window.location.assign(redeem.href);
  return null;
}

/** The webview's first-touch cookie, which is httpOnly, so the server reads
 * it out. Attribution is a nice-to-have: any failure means none. */
async function webviewFirstTouch(): Promise<string | null> {
  try {
    const res = await fetch('/api/native-auth/first-touch', {
      cache: 'no-store'
    });
    const { firstTouch } = (await res.json()) as { firstTouch?: unknown };
    return typeof firstTouch === 'string' ? firstTouch : null;
  } catch {
    return null;
  }
}
