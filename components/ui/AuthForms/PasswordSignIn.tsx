'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import AuthField from './AuthField';
import AuthLinks from './AuthLinks';
import { signInWithPassword } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { BusyIcon } from '@/components/ui/busy-icon';

interface PasswordSignInProps {
  allowEmail: boolean;
  redirectMethod: string;
  /** In-app path to land on afterwards. */
  next: string;
}

export default function PasswordSignIn({
  allowEmail,
  redirectMethod,
  next
}: PasswordSignInProps) {
  const clientRouter = useRouter();
  const router = redirectMethod === 'client' ? clientRouter : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    await handleRequest(e, signInWithPassword, router);
    setIsSubmitting(false);
  };

  return (
    <div>
      <form noValidate onSubmit={handleSubmit} className="grid gap-4">
        <input type="hidden" name="next" value={next} />
        <AuthField
          id="email"
          name="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="username"
        />
        <AuthField
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
        />
        <Button type="submit" disabled={isSubmitting}>
          <BusyIcon busy={isSubmitting} />
          {isSubmitting ? 'Signing in' : 'Sign in'}
        </Button>
      </form>
      <AuthLinks
        links={[
          { href: '/signin/forgot_password', label: 'Forgot your password?' },
          ...(allowEmail
            ? [
                {
                  href: '/signin/email_signin',
                  label: 'Email me a sign-in link'
                }
              ]
            : []),
          { href: '/signin/signup', label: 'No account yet? Create one' }
        ]}
      />
    </div>
  );
}
