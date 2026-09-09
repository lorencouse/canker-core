'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import AuthField from './AuthField';
import AuthLinks from './AuthLinks';
import { signInWithEmail } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';

interface EmailSignInProps {
  allowPassword: boolean;
  redirectMethod: string;
  disableButton?: boolean;
}

export default function EmailSignIn({
  allowPassword,
  redirectMethod,
  disableButton
}: EmailSignInProps) {
  const clientRouter = useRouter();
  const router = redirectMethod === 'client' ? clientRouter : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    await handleRequest(e, signInWithEmail, router);
    setIsSubmitting(false);
  };

  return (
    <div>
      <form noValidate onSubmit={handleSubmit} className="grid gap-4">
        <AuthField
          id="email"
          name="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          hint="We'll send a link that signs you in. No password needed."
        />
        <Button type="submit" disabled={disableButton || isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? 'Sending' : 'Send sign-in link'}
        </Button>
      </form>
      <AuthLinks
        links={[
          ...(allowPassword
            ? [
                {
                  href: '/signin/password_signin',
                  label: 'Sign in with a password'
                }
              ]
            : []),
          { href: '/signin/signup', label: 'No account yet? Create one' }
        ]}
      />
    </div>
  );
}
