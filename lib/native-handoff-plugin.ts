/**
 * Better Auth plugin behind the iOS system sign-in handoff
 * (utils/native-auth.ts has the whole flow).
 *
 * Both endpoints are server-only: they are reachable through `auth.api.*`
 * from app/api/native-auth/* and are never mounted under /api/auth, so the
 * only way to mint or redeem is through those route handlers and their
 * cookie checks. They live in a plugin rather than in the route handlers
 * because creating a session and setting its signed cookie needs Better
 * Auth's endpoint context.
 */
import type { BetterAuthPlugin } from 'better-auth';
import {
  createAuthEndpoint,
  sessionMiddleware,
  APIError
} from 'better-auth/api';
import { deleteSessionCookie, setSessionCookie } from 'better-auth/cookies';
import { z } from 'zod';
import {
  mintHandoff,
  redeemHandoff,
  type HandoffStore
} from '@/utils/native-handoff';

type InternalAdapter = {
  createVerificationValue(data: {
    identifier: string;
    value: string;
    expiresAt: Date;
  }): Promise<unknown>;
  consumeVerificationValue(
    identifier: string
  ): Promise<{ value: string; expiresAt: Date } | null>;
};

/** Better Auth's verification table, whose consume is an atomic delete that
 * also refuses expired rows. */
const storeFor = (adapter: InternalAdapter): HandoffStore => ({
  put: async (identifier, value, expiresAt) => {
    await adapter.createVerificationValue({ identifier, value, expiresAt });
  },
  take: async (identifier) => {
    const row = await adapter.consumeVerificationValue(identifier);
    return row
      ? { value: row.value, expiresAt: new Date(row.expiresAt) }
      : null;
  }
});

export const nativeHandoff = () =>
  ({
    id: 'native-handoff',
    endpoints: {
      /**
       * Swaps the caller's session (the one the sign-in sheet just got) for
       * a handoff token, then ends that session. The sheet shares Safari's
       * cookies, and leaving a 30-day session behind in Safari is not
       * something the person asked for when they signed in to the app.
       */
      mintNativeHandoff: createAuthEndpoint.serverOnly(
        {
          method: 'POST',
          body: z.object({ nonce: z.string() }),
          use: [sessionMiddleware]
        },
        async (ctx) => {
          const { session, user } = ctx.context.session;
          const token = await mintHandoff(
            storeFor(ctx.context.internalAdapter),
            {
              userId: user.id,
              nonce: ctx.body.nonce
            }
          );
          await ctx.context.internalAdapter.deleteSession(session.token);
          deleteSessionCookie(ctx);
          return ctx.json({ token });
        }
      ),

      /** Spends a handoff token and signs the caller in as a new session. */
      redeemNativeHandoff: createAuthEndpoint.serverOnly(
        {
          method: 'POST',
          body: z.object({ token: z.string(), nonce: z.string() })
        },
        async (ctx) => {
          const result = await redeemHandoff(
            storeFor(ctx.context.internalAdapter),
            { token: ctx.body.token, nonce: ctx.body.nonce }
          );
          if (!result.ok) {
            throw new APIError('BAD_REQUEST', { message: result.reason });
          }
          const user = await ctx.context.internalAdapter.findUserById(
            result.userId
          );
          if (!user) {
            throw new APIError('BAD_REQUEST', { message: 'invalid_token' });
          }
          const session = await ctx.context.internalAdapter.createSession(
            user.id
          );
          if (!session) {
            throw new APIError('INTERNAL_SERVER_ERROR', {
              message: 'session_failed'
            });
          }
          await setSessionCookie(ctx, { session, user });
          return ctx.json({ ok: true });
        }
      )
    }
  }) satisfies BetterAuthPlugin;
