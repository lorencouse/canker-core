import Logo from '@/components/icons/Logo';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getAuthTypes,
  getViewTypes,
  getDefaultSignInView,
  getRedirectMethod
} from '@/utils/auth-helpers/settings';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

export default async function SignIn({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ disable_button: boolean }>;
}) {
  const { allowOauth, allowEmail, allowPassword } = getAuthTypes();
  const viewTypes = getViewTypes();
  const redirectMethod = getRedirectMethod();

  // Declare 'viewProp' and initialize with the default value
  let viewProp: string;
  let paramsId = (await params).id;
  let disableButton = (await searchParams).disable_button;

  // Assign url id to 'viewProp' if it's a valid string and ViewTypes includes it
  if (typeof paramsId === 'string' && viewTypes.includes(paramsId)) {
    viewProp = paramsId;
  } else {
    const cookieStore = await cookies();
    const preferredSignInView =
      cookieStore.get('preferredSignInView')?.value || null;
    viewProp = getDefaultSignInView(preferredSignInView);
    return redirect(`/signin/${viewProp}`);
  }

  // Check if the user is already logged in and redirect to the account page if so
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user && viewProp !== 'update_password') {
    return redirect('/');
  } else if (!user && viewProp === 'update_password') {
    return redirect('/signin');
  }

  return (
    <div className="flex justify-center height-screen-helper">
      <div className="flex flex-col justify-between max-w-lg p-3 m-auto w-80 ">
        <div className="flex justify-center pb-12 ">
          <Logo width="110px" height="110px" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              {viewProp === 'forgot_password'
                ? 'Reset Password'
                : viewProp === 'update_password'
                  ? 'Update Password'
                  : viewProp === 'signup'
                    ? 'Sign Up'
                    : 'Sign In'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {viewProp === 'password_signin' && (
              <PasswordSignIn
                allowEmail={allowEmail}
                redirectMethod={redirectMethod}
              />
            )}
            {viewProp === 'email_signin' && (
              <EmailSignIn
                allowPassword={allowPassword}
                redirectMethod={redirectMethod}
                disableButton={disableButton}
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
              <UpdatePassword redirectMethod={redirectMethod} />
            )}
            {viewProp === 'signup' && (
              <SignUp allowEmail={allowEmail} redirectMethod={redirectMethod} />
            )}
            {viewProp !== 'update_password' &&
              viewProp !== 'signup' &&
              allowOauth && (
                <>
                  <Separator text="Third-party sign-in" />
                  <OauthSignIn />
                </>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
