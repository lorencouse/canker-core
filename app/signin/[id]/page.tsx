import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getUser } from '@/lib/queries';
import {
  getAuthTypes,
  getViewTypes,
  getDefaultSignInView,
  getRedirectMethod,
  safeNext
} from '@/utils/auth-helpers/settings';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import PasswordSignIn from '@/components/ui/AuthForms/PasswordSignIn';
import EmailSignIn from '@/components/ui/AuthForms/EmailSignIn';
import Separator from '@/components/ui/AuthForms/Separator';
import OauthSignIn from '@/components/ui/AuthForms/OauthSignIn';
import ForgotPassword from '@/components/ui/AuthForms/ForgotPassword';
import UpdatePassword from '@/components/ui/AuthForms/UpdatePassword';
import SignUp from '@/components/ui/AuthForms/Signup';

/** Heading and supporting line for each view, kept in one place. */
const COPY: Record<string, { title: string; description: string }> = {
  password_signin: {
    title: 'Sign in',
    description: 'Pick up where you left off with your mouth map.'
  },
  email_signin: {
    title: 'Sign in',
    description: 'We’ll email you a link instead of asking for a password.'
  },
  forgot_password: {
    title: 'Reset your password',
    description: 'Tell us your email and we’ll send a reset link.'
  },
  update_password: {
    title: 'Choose a new password',
    description: 'This replaces the password on your account.'
  },
  signup: {
    title: 'Create your account',
    description: 'Start tracking the sore you have right now.'
  }
};

export default async function SignIn({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    disable_button: boolean;
    token?: string;
    error?: string;
    /** Where to go after signing in; set by the middleware. */
    next?: string;
  }>;
}) {
  const { allowOauth, allowEmail, allowPassword } = getAuthTypes();
  const viewTypes = getViewTypes();
  const redirectMethod = getRedirectMethod();

  const paramsId = (await params).id;
  const resolvedSearchParams = await searchParams;
  const disableButton = resolvedSearchParams.disable_button;
  // Better Auth appends the one-time reset token to the callback URL.
  const resetToken = resolvedSearchParams.token ?? '';
  const next = safeNext(resolvedSearchParams.next);

  let viewProp: string;
  if (typeof paramsId === 'string' && viewTypes.includes(paramsId)) {
    viewProp = paramsId;
  } else {
    const cookieStore = await cookies();
    const preferredSignInView =
      cookieStore.get('preferredSignInView')?.value || null;
    viewProp = getDefaultSignInView(preferredSignInView);
    return redirect(`/signin/${viewProp}`);
  }

  const user = await getUser();

  if (user && viewProp !== 'update_password') {
    return redirect(next);
  } else if (!user && viewProp === 'update_password' && !resetToken) {
    // Reaching this view without a session *and* without a reset token means
    // the link was never valid or has already been consumed.
    return redirect('/signin/forgot_password');
  }

  const copy = COPY[viewProp] ?? COPY.password_signin;
  const showOauth =
    allowOauth &&
    viewProp !== 'update_password' &&
    viewProp !== 'forgot_password';

  return (
    /*
      The wordmark and the centring live in the sign-in layout. On a phone
      the card drops its border and sits directly on the background: a
      floating panel inside a screen that contains nothing else reads as a
      web form, where a full-bleed one reads as the app's first screen.
    */
    <Card className="border-0 bg-transparent shadow-none sm:border sm:bg-card">
      <CardHeader>
        <CardTitle className="text-section">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {viewProp === 'password_signin' && (
          <PasswordSignIn
            allowEmail={allowEmail}
            redirectMethod={redirectMethod}
            next={next}
          />
        )}
        {viewProp === 'email_signin' && (
          <EmailSignIn
            allowPassword={allowPassword}
            redirectMethod={redirectMethod}
            disableButton={disableButton}
            next={next}
          />
        )}
        {viewProp === 'forgot_password' && (
          <ForgotPassword
            allowEmail={allowEmail}
            redirectMethod={redirectMethod}
            disableButton={disableButton}
          />
        )}
        {viewProp === 'update_password' && (
          <UpdatePassword redirectMethod={redirectMethod} token={resetToken} />
        )}
        {viewProp === 'signup' && (
          <SignUp allowEmail={allowEmail} redirectMethod={redirectMethod} />
        )}

        {showOauth && (
          <div className="mt-6">
            <Separator text="or" />
            <div className="mt-4">
              <OauthSignIn next={next} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
