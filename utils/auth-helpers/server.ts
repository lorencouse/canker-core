'use server';

import { headers as nextHeaders, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { APIError } from 'better-auth/api';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db/pool';
import { getURL, getErrorRedirect, getStatusRedirect } from '@/utils/helpers';
import { User } from '@/types';

/**
 * Server-side auth actions.
 *
 * These keep the exact signature the AuthForms components already use —
 * `(formData: FormData) => Promise<string>` returning a redirect path — so the
 * swap from Supabase Auth to Better Auth is invisible to the form components.
 *
 * Two mechanical differences from the Supabase versions:
 *   - Better Auth throws `APIError` on failure instead of returning `{ error }`,
 *     so each call is wrapped and the message pulled off the error.
 *   - Every `auth.api.*` call must be passed the incoming request headers.
 */

function isValidEmail(email: string) {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(email);
}

/** Pull a human-readable message off whatever Better Auth threw. */
function messageOf(err: unknown, fallback: string): string {
  if (err instanceof APIError) return err.body?.message ?? err.message ?? fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function redirectToPath(path: string) {
  return redirect(path);
}

export async function SignOut(formData: FormData): Promise<string> {
  const pathName = String(formData.get('pathName')).trim();

  try {
    await auth.api.signOut({ headers: await nextHeaders() });
  } catch (err) {
    return getErrorRedirect(
      pathName,
      'Hmm... Something went wrong.',
      messageOf(err, 'You could not be signed out.')
    );
  }

  return '/signin';
}

/** Magic-link sign in. Replaces supabase.auth.signInWithOtp. */
export async function signInWithEmail(formData: FormData): Promise<string> {
  const cookieStore = await cookies();
  const email = String(formData.get('email')).trim();

  if (!isValidEmail(email)) {
    return getErrorRedirect(
      '/signin/email_signin',
      'Invalid email address.',
      'Please try again.'
    );
  }

  try {
    await auth.api.signInMagicLink({
      body: { email, callbackURL: '/' },
      headers: await nextHeaders()
    });
  } catch (err) {
    return getErrorRedirect(
      '/signin/email_signin',
      'You could not be signed in.',
      messageOf(err, 'Please try again.')
    );
  }

  cookieStore.set('preferredSignInView', 'email_signin', { path: '/' });
  return getStatusRedirect(
    '/signin/email_signin',
    'Success!',
    'Please check your email for a magic link. You may now close this tab.',
    true
  );
}

export async function requestPasswordUpdate(formData: FormData): Promise<string> {
  const email = String(formData.get('email')).trim();

  if (!isValidEmail(email)) {
    return getErrorRedirect(
      '/signin/forgot_password',
      'Invalid email address.',
      'Please try again.'
    );
  }

  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: '/signin/update_password' },
      headers: await nextHeaders()
    });
  } catch (err) {
    return getErrorRedirect(
      '/signin/forgot_password',
      messageOf(err, 'Password reset email could not be sent.'),
      'Please try again.'
    );
  }

  return getStatusRedirect(
    '/signin/forgot_password',
    'Success!',
    'Please check your email for a password reset link. You may now close this tab.',
    true
  );
}

export async function signInWithPassword(formData: FormData): Promise<string> {
  const cookieStore = await cookies();
  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();

  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await nextHeaders()
    });
  } catch (err) {
    return getErrorRedirect(
      '/signin/password_signin',
      'Sign in failed.',
      messageOf(err, 'You could not be signed in.')
    );
  }

  cookieStore.set('preferredSignInView', 'password_signin', { path: '/' });
  return getStatusRedirect('/', 'Success!', 'You are now signed in.');
}

export async function signUp(formData: FormData): Promise<string> {
  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();

  if (!isValidEmail(email)) {
    return getErrorRedirect('/signin/signup', 'Invalid email address.', 'Please try again.');
  }

  try {
    await auth.api.signUpEmail({
      // `name` is required by Better Auth; the sign-up form only collects an
      // email, so it seeds from the local part and the user can edit it later
      // under /profile.
      body: { email, password, name: email.split('@')[0] },
      headers: await nextHeaders()
    });
  } catch (err) {
    const message = messageOf(err, 'You could not be signed up.');
    // Better Auth reports an existing address as a generic conflict; keep the
    // wording the app already showed for this case.
    const friendly = /exist|already/i.test(message)
      ? 'There is already an account associated with this email address. Try resetting your password.'
      : message;
    return getErrorRedirect('/signin/signup', 'Sign up failed.', friendly);
  }

  return getStatusRedirect('/', 'Success!', 'You are now signed in.');
}

/**
 * Set a new password.
 *
 * Two entry points, matching the two ways the app reaches this form:
 *   - from a reset email, which carries a one-time `token`
 *   - from an authenticated session, which supplies the current password
 */
export async function updatePassword(formData: FormData): Promise<string> {
  const password = String(formData.get('password')).trim();
  const passwordConfirm = String(formData.get('passwordConfirm')).trim();
  const token = String(formData.get('token') ?? '').trim();

  if (password !== passwordConfirm) {
    return getErrorRedirect(
      '/signin/update_password',
      'Your password could not be updated.',
      'Passwords do not match.'
    );
  }

  try {
    if (token) {
      await auth.api.resetPassword({
        body: { newPassword: password, token },
        headers: await nextHeaders()
      });
    } else {
      const currentPassword = String(formData.get('currentPassword') ?? '').trim();
      if (!currentPassword) {
        return getErrorRedirect(
          '/signin/forgot_password',
          'Your password could not be updated.',
          'This reset link is invalid or has expired. Please request a new one.'
        );
      }
      await auth.api.changePassword({
        body: { newPassword: password, currentPassword },
        headers: await nextHeaders()
      });
    }
  } catch (err) {
    return getErrorRedirect(
      '/signin/update_password',
      'Your password could not be updated.',
      messageOf(err, 'Please request a new reset link and try again.')
    );
  }

  return getStatusRedirect('/', 'Success!', 'Your password has been updated.');
}

export async function updateEmail(formData: FormData): Promise<string> {
  const newEmail = String(formData.get('newEmail')).trim();

  if (!isValidEmail(newEmail)) {
    return getErrorRedirect(
      '/profile',
      'Your email could not be updated.',
      'Invalid email address.'
    );
  }

  try {
    await auth.api.changeEmail({
      body: { newEmail, callbackURL: '/profile' },
      headers: await nextHeaders()
    });
  } catch (err) {
    return getErrorRedirect(
      '/profile',
      'Your email could not be updated.',
      messageOf(err, 'Please try again.')
    );
  }

  return getStatusRedirect(
    '/profile',
    'Confirmation email sent.',
    'Check your new address for a link to confirm the change.'
  );
}

export async function updateName(formData: FormData): Promise<string> {
  const fullName = String(formData.get('fullName')).trim();

  try {
    await auth.api.updateUser({
      body: { name: fullName },
      headers: await nextHeaders()
    });
  } catch (err) {
    return getErrorRedirect(
      '/profile',
      'Your name could not be updated.',
      messageOf(err, 'Please try again.')
    );
  }

  return getStatusRedirect('/profile', 'Success!', 'Your name has been updated.');
}

export async function updateUserProfile(formData: Partial<User>): Promise<{
  data: User | null;
  message: string;
}> {
  const session = await auth.api.getSession({ headers: await nextHeaders() });

  if (!session?.user) {
    return { data: null, message: 'User not authenticated' };
  }

  try {
    await auth.api.updateUser({
      body: {
        name: formData.full_name ?? undefined,
        username: formData.username ?? undefined,
        bio: formData.bio ?? undefined
      },
      headers: await nextHeaders()
    });
  } catch (err) {
    return { data: null, message: messageOf(err, 'Your profile could not be updated.') };
  }

  const [updated] = await query<{
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    username: string | null;
    bio: string | null;
  }>('select id, email, name, image, username, bio from "user" where id = $1', [session.user.id]);

  return {
    data: updated
      ? {
          id: updated.id,
          email: updated.email,
          full_name: updated.name,
          avatar_url: updated.image,
          username: updated.username,
          bio: updated.bio
        }
      : null,
    message: 'Success!'
  };
}
