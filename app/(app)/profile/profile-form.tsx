'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import AuthField from '@/components/ui/AuthForms/AuthField';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';
import { handleRequest } from '@/utils/auth-helpers/client';
import { updateEmail, updateName } from '@/utils/auth-helpers/server';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';

/**
 * Name and email, as two small forms rather than one.
 *
 * They finish differently: a name change is immediate, an email change sends
 * a confirmation to the new address and nothing changes until it is clicked.
 * One Save button for both would have to explain two outcomes at once.
 */
export function ProfileForm({ user }: { user: User }) {
  const clientRouter = useRouter();
  const router = getRedirectMethod() === 'client' ? clientRouter : null;
  const [saving, setSaving] = useState<'name' | 'email' | null>(null);

  const submit =
    (which: 'name' | 'email', action: (fd: FormData) => Promise<string>) =>
    async (e: React.FormEvent<HTMLFormElement>) => {
      setSaving(which);
      try {
        await handleRequest(e, action, router);
      } finally {
        setSaving(null);
      }
    };

  return (
    <div className="space-y-8">
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
          <Button type="submit" disabled={saving !== null}>
            {saving === 'name' && <Loader2 className="animate-spin" />}
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
          hint="Changing this sends a confirmation link to the new address. Your sign-in email stays as it is until you click it."
        />
        <div>
          <Button
            type="submit"
            variant="outline"
            disabled={saving !== null}
          >
            {saving === 'email' && <Loader2 className="animate-spin" />}
            Change email
          </Button>
        </div>
      </form>
    </div>
  );
}
