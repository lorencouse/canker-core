/**
 * Better Auth plugin behind the native system sign-in handoff
 * (utils/native-auth.ts has the whole flow).
 *
 * Every endpoint is server-only: they are reachable through `auth.api.*`
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
  holdPending,
  mintHandoff,
  redeemHandoff,
  takePending,
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
       * Ends the caller's session (the one the sign-in sheet just got) at
       * once and holds its user as a pending handoff for this flow, so the
       * confirmation page can be answered without Safari staying signed in.
       * The sheet shares Safari's cookies (the Android tab, Chrome's), and leaving a 30-day session
       * behind there is not something the person asked for, even if they
       * close the sheet without answering.
       */
      holdNativeHandoff: createAuthEndpoint.serverOnly(
        {
          method: 'POST',
          body: z.object({ flow: z.string() }),
          use: [sessionMiddleware]
        },
        async (ctx) => {
          const { session, user } = ctx.context.session;
          await ctx.context.internalAdapter.deleteSession(session.token);
          deleteSessionCookie(ctx);
          await holdPending(storeFor(ctx.context.internalAdapter), {
            userId: user.id,
            flow: ctx.body.flow
          });
          return ctx.json({ email: user.email });
        }
      ),

      /** Continue: spends the pending handoff on a handoff token. */
      mintNativeHandoff: createAuthEndpoint.serverOnly(
        {
          method: 'POST',
          body: z.object({ flow: z.string() })
        },
        async (ctx) => {
          const store = storeFor(ctx.context.internalAdapter);
          const pending = await takePending(store, ctx.body.flow);
          if (!pending) {
            throw new APIError('BAD_REQUEST', { message: 'expired_token' });
          }
          const token = await mintHandoff(store, {
            userId: pending.userId,
            nonce: ctx.body.flow
          });
          return ctx.json({ token });
        }
      ),

      /** Cancel: throws the pending handoff away. */
      discardNativeHandoff: createAuthEndpoint.serverOnly(
        {
          method: 'POST',
          body: z.object({ flow: z.string() })
        },
        async (ctx) => {
          await takePending(
            storeFor(ctx.context.internalAdapter),
            ctx.body.flow
          );
          return ctx.json({ ok: true });
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
