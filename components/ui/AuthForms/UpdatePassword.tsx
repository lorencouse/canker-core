'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import AuthField from './AuthField';
import { updatePassword } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { BusyIcon } from '@/components/ui/busy-icon';

interface UpdatePasswordProps {
  redirectMethod: string;
  /** One-time reset token from the password-reset email, when present. */
  token?: string;
}

export default function UpdatePassword({
  redirectMethod,
  token
}: UpdatePasswordProps) {
  const clientRouter = useRouter();
  const router = redirectMethod === 'client' ? clientRouter : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    await handleRequest(e, updatePassword, router);
    setIsSubmitting(false);
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="grid gap-4">
      <input type="hidden" name="token" value={token ?? ''} />
      <AuthField
        id="password"
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
      />
      <AuthField
        id="passwordConfirm"
        name="passwordConfirm"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
      />
      <Button type="submit" disabled={isSubmitting}>
        <BusyIcon busy={isSubmitting} />
        {isSubmitting ? 'Saving' : 'Save new password'}
      </Button>
    </form>
  );
}
