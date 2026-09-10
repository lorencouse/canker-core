'use client';

import { authClient } from '@/lib/auth-client';
import { redirectToPath } from './server';
import { safeNext } from './settings';
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
 * Start an OAuth redirect. Better Auth handles the callback at
 * /api/auth/callback/<provider>, so there is no app-level callback route.
 */
export async function signInWithOAuth(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const provider = String(formData.get('provider')).trim() as OAuthProvider;

  await authClient.signIn.social({
    provider,
    callbackURL: safeNext(formData.get('next')),
    errorCallbackURL: '/signin'
  });
}
