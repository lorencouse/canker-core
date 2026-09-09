/**
 * Better Auth browser client.
 *
 * Only used for flows that must start in the browser (OAuth redirects). Every
 * other flow goes through the server actions in utils/auth-helpers/server.ts,
 * preserving the existing form-action shape of the app.
 */
'use client';

import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL,
  plugins: [magicLinkClient()]
});

export const { signIn, signOut, signUp, useSession } = authClient;
