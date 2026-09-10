/**
 * Better Auth server instance.
 *
 * Replaces Supabase Auth. Runs in-process against the same Postgres pool the
 * rest of the app uses — no extra container, no extra service, no extra cost.
 *
 * Covers the four flows the app previously got from Supabase:
 *   - email + password sign in / sign up   (emailAndPassword)
 *   - magic link sign in                   (magicLink plugin)
 *   - GitHub / Google OAuth                (socialProviders)
 *   - password reset + email verification  (sendResetPassword / emailVerification)
 */
import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins/magic-link';
import { nextCookies } from 'better-auth/next-js';
import { pool } from '@/lib/db/pool';
import { sendEmail, actionEmail } from '@/lib/email/mailer';
import { getURL } from '@/utils/helpers';

export const auth = betterAuth({
  database: pool,

  // BETTER_AUTH_URL / SITE_URL are runtime values, so the public URL can change
  // without rebuilding the image.
  baseURL: (process.env.BETTER_AUTH_URL || getURL()).replace(/\/$/, ''),

  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
    // Existing accounts were migrated without their Supabase password hashes,
    // so they set a password via the reset flow on first sign in.
    requireEmailVerification: false,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      const { text, html } = actionEmail({
        heading: 'Reset your password',
        body: 'Click below to choose a new password for your Canker Core account. This link expires in one hour.',
        buttonLabel: 'Reset password',
        url
      });
      await sendEmail({ to: user.email, subject: 'Reset your Canker Core password', text, html });
    }
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { text, html } = actionEmail({
        heading: 'Confirm your email',
        body: 'Welcome to Canker Core. Confirm your email address to finish setting up your account.',
        buttonLabel: 'Confirm email',
        url
      });
      await sendEmail({ to: user.email, subject: 'Confirm your Canker Core email', text, html });
    }
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    }
  },

  user: {
    // Profile columns the app reads via getUserDetails(). Supabase kept these in
    // a separate public.users table mirrored from auth.users by a trigger; here
    // they live directly on the auth user row, so the trigger and the mirror
    // table both go away.
    //
    additionalFields: {
      username: { type: 'string', required: false, input: true },
      bio: { type: 'string', required: false, input: true }
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ newEmail, url }: { newEmail: string; url: string }) => {
        const { text, html } = actionEmail({
          heading: 'Confirm your new email',
          body: 'Confirm this address to finish updating the email on your Canker Core account.',
          buttonLabel: 'Confirm email change',
          url
        });
        await sendEmail({ to: newEmail, subject: 'Confirm your new Canker Core email', text, html });
      }
    }
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh the row at most once a day
    cookieCache: {
      // Avoids a DB round trip for the session on every request/render.
      enabled: true,
      maxAge: 5 * 60
    }
  },

  advanced: {
    // Existing users carry Supabase UUIDs; keep generating UUIDs so ids stay
    // uniform and the migrated rows are indistinguishable from new ones.
    database: {
      generateId: () => crypto.randomUUID()
    }
  },

  plugins: [
    magicLink({
      expiresIn: 60 * 10,
      // Matches the old Supabase behaviour: with password auth enabled, a magic
      // link signs in an existing account but never silently creates one.
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
        const { text, html } = actionEmail({
          heading: 'Your sign-in link',
          body: 'Click below to sign in to Canker Core. This link expires in 10 minutes and can only be used once.',
          buttonLabel: 'Sign in',
          url
        });
        await sendEmail({ to: email, subject: 'Sign in to Canker Core', text, html });
      }
    }),
    // Must stay last: lets server actions set auth cookies on the response.
    nextCookies()
  ]
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
