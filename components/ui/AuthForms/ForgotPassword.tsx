'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import AuthField from './AuthField';
import AuthLinks from './AuthLinks';
import { requestPasswordUpdate } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';

interface ForgotPasswordProps {
  allowEmail: boolean;
  redirectMethod: string;
  disableButton?: boolean;
}

export default function ForgotPassword({
  allowEmail,
  redirectMethod,
  disableButton
}: ForgotPasswordProps) {
  const clientRouter = useRouter();
  const router = redirectMethod === 'client' ? clientRouter : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    await handleRequest(e, requestPasswordUpdate, router);
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
          hint="We'll send a link to choose a new password."
        />
        <Button type="submit" disabled={disableButton || isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? 'Sending' : 'Send reset link'}
        </Button>
      </form>
      <AuthLinks
        links={[
          { href: '/signin/password_signin', label: 'Back to sign in' },
          ...(allowEmail
            ? [
                {
                  href: '/signin/email_signin',
                  label: 'Email me a sign-in link instead'
                }
              ]
            : [])
        ]}
      />
    </div>
  );
}
