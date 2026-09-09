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

// No baseURL: the client defaults to the origin it was served from, so the same
// image works on the staging domain and on cankercore.com without a rebuild.
export const authClient = createAuthClient({
  plugins: [magicLinkClient()]
});

export const { signIn, signOut, signUp, useSession } = authClient;
