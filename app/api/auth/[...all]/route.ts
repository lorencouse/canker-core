/**
 * Better Auth request handler.
 *
 * Serves every auth endpoint under /api/auth/* — sign in/up, sign out, OAuth
 * callbacks, magic-link verification, password reset and email verification.
 * This replaces the Supabase-hosted GoTrue endpoints.
 */
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth.handler);
