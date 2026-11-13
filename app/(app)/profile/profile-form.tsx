'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import AuthField from '@/components/ui/AuthForms/AuthField';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';
import { handleRequest } from '@/utils/auth-helpers/client';
import { updateEmail, updateName } from '@/utils/auth-helpers/server';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import { BusyIcon } from '@/components/ui/busy-icon';

/**
 * Name and email, as two small forms rather than one.
 *
 * They finish differently: a name change is immediate, an email change sends
 * a confirmation to the new address and nothing changes until it is clicked.
 * One Save button for both would have to explain two outcomes at once.
 */
export function ProfileForm({
  user,
  onDone
}: {
  user: User;
  /** After either form has been sent, so a sheet holding them can close. */
  onDone?: () => void;
}) {
  const clientRouter = useRouter();
  const router = getRedirectMethod() === 'client' ? clientRouter : null;
  const [saving, setSaving] = useState<'name' | 'email' | null>(null);

  const submit =
    (which: 'name' | 'email', action: (fd: FormData) => Promise<string>) =>
    async (e: React.FormEvent<HTMLFormElement>) => {
      setSaving(which);
      try {
        await handleRequest(e, action, router);
        onDone?.();
      } finally {
        setSaving(null);
      }
    };

  return (
    <div className="space-y-6">
      <form
        noValidate
        onSubmit={submit('name', updateName)}
        className="grid gap-4"
      >
        <AuthField
          id="fullName"
          name="fullName"
          label="Name"
          type="text"
          autoComplete="name"
          defaultValue={user.full_name ?? ''}
        />
        <div>
          <Button type="submit" size="touch" disabled={saving !== null}>
            <BusyIcon busy={saving === 'name'} />
            Save name
          </Button>
        </div>
      </form>

      <form
        noValidate
        onSubmit={submit('email', updateEmail)}
        className="grid gap-4"
      >
        <AuthField
          id="newEmail"
          name="newEmail"
          label="Email"
          type="email"
          autoComplete="email"
          defaultValue={user.email}
          hint="We email the new address a link to confirm it."
        />
        <div>
          <Button
            type="submit"
            variant="outline"
            size="touch"
            disabled={saving !== null}
          >
            <BusyIcon busy={saving === 'email'} />
            Change email
          </Button>
        </div>
      </form>
    </div>
  );
}
