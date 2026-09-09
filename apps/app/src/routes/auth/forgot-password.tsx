import { createRoute, Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { emailSchema } from '@canker/core';
import { Button, Input, Label } from '@canker/ui';
import { rootRoute } from '@/router-base';
import { authRedirectUrl, supabase } from '@/lib/supabase';
import { AuthLayout, FormError, FormNotice } from '@/components/auth-layout';

export const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const em = emailSchema.safeParse(email);
    if (!em.success)
      return setError(em.error.issues[0]?.message ?? 'Enter a valid email');
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(em.data, {
        redirectTo: authRedirectUrl('/reset-password')
      });
      if (error) return setError(error.message);
      setNotice('If that address has an account, a reset link is on its way.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one."
    >
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <FormError message={error} />
        <FormNotice message={notice} />
        <Button type="submit" disabled={busy} size="lg">
          {busy ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
      <p className="text-secondary-foreground mt-8 text-center text-sm">
        <Link
          to="/login"
          search={{}}
          className="text-accent underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
