'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import AuthField from '@/components/ui/AuthForms/AuthField';
import { Button } from '@/components/ui/button';
import { BusyIcon } from '@/components/ui/busy-icon';
import { handleRequest } from '@/utils/auth-helpers/client';
import { updatePassword } from '@/utils/auth-helpers/server';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';

/**
 * Change password: current, new, and the new one again. It opens in a sheet
 * from Settings, a short edit rather than a page of its own.
 */
export function PasswordForm({ onDone }: { onDone?: () => void }) {
  const clientRouter = useRouter();
  const router = getRedirectMethod() === 'client' ? clientRouter : null;
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    setSaving(true);
    try {
      await handleRequest(e, updatePassword, router);
      onDone?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={submit} className="grid gap-4">
      <AuthField
        id="currentPassword"
        name="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        hint="No password yet? Use “Forgot password” when signing in."
      />
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
      <Button type="submit" size="touch" className="w-full" disabled={saving}>
        <BusyIcon busy={saving} />
        Change password
      </Button>
    </form>
  );
}
