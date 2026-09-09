import { createRoute, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { passwordSchema } from '@canker/core';
import { Button, Input, Label } from '@canker/ui';
import { rootRoute } from '@/router-base';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { AuthLayout, FormError } from '@/components/auth-layout';

/** Landing page for the recovery link. Supabase has already exchanged the token for a session. */
export const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: ResetPasswordPage
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const pw = passwordSchema.safeParse(password);
    if (!pw.success)
      return setError(pw.error.issues[0]?.message ?? 'Choose a longer password');
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw.data });
      if (error) return setError(error.message);
      await navigate({ to: '/today', search: {} });
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <AuthLayout
        title="Link expired"
        subtitle="Reset links only work once and for a short time."
      >
        <Button onClick={() => void navigate({ to: '/forgot-password' })}>
          Request a new one
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <FormError message={error} />
        <Button type="submit" disabled={busy} size="lg">
          {busy ? 'Saving…' : 'Save password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
