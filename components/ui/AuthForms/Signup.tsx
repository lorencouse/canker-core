'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthField from './AuthField';
import AuthLinks from './AuthLinks';
import { signUp } from '@/utils/auth-helpers/server';

type Message = { type: 'error' | 'success'; content: string };

// An OAuth or email-link failure comes back as ?error=…&error_description=….
function messageFromParams(params: URLSearchParams): Message | null {
  const error = params.get('error');
  const description = params.get('error_description');
  return error && description
    ? { type: 'error', content: decodeURIComponent(description) }
    : null;
}

interface SignUpProps {
  allowEmail: boolean;
  redirectMethod: string;
}

export default function SignUp({ allowEmail }: SignUpProps) {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<Message | null>(() =>
    messageFromParams(searchParams)
  );

  const [shownParams, setShownParams] = useState(searchParams);
  if (searchParams !== shownParams) {
    setShownParams(searchParams);
    const fromParams = messageFromParams(searchParams);
    if (fromParams) setMessage(fromParams);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    try {
      await signUp(formData);
      setMessage({
        type: 'success',
        content: 'Account created. Check your email to confirm it.'
      });
    } catch {
      setMessage({
        type: 'error',
        content: "That didn't go through. Check the details and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {message && (
        <Alert
          variant={message.type === 'error' ? 'destructive' : 'default'}
          className="mb-4"
        >
          <AlertDescription>{message.content}</AlertDescription>
        </Alert>
      )}
      <form noValidate onSubmit={handleSubmit} className="grid gap-4">
        <AuthField
          id="email"
          name="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
        />
        <AuthField
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? 'Creating account' : 'Create account'}
        </Button>
      </form>
      <AuthLinks
        links={[
          {
            href: '/signin/password_signin',
            label: 'Already have an account? Sign in'
          },
          ...(allowEmail
            ? [
                {
                  href: '/signin/email_signin',
                  label: 'Email me a sign-in link'
                }
              ]
            : [])
        ]}
      />
    </div>
  );
}
