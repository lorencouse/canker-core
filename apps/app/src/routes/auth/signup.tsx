import { createRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { emailSchema, passwordSchema } from '@canker/core';
import { Button, Input, Label, Separator } from '@canker/ui';
import { rootRoute } from '@/router-base';
import { authRedirectUrl, supabase } from '@/lib/supabase';
import { AuthLayout, FormError, FormNotice } from '@/components/auth-layout';
import { OAuthButtons } from '@/components/oauth-buttons';

export const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  beforeLoad: ({ context }) => {
    if (context.auth.user) throw redirect({ to: '/today', search: {} });
  },
  component: SignupPage
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const em = emailSchema.safeParse(email);
    if (!em.success)
      return setError(em.error.issues[0]?.message ?? 'Enter a valid email');
    const pw = passwordSchema.safeParse(password);
    if (!pw.success)
      return setError(pw.error.issues[0]?.message ?? 'Choose a longer password');
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: em.data,
        password: pw.data,
        options: { emailRedirectTo: authRedirectUrl() }
      });
      if (error) return setError(error.message);
      if (data.session) {
        await navigate({ to: '/onboarding' });
      } else {
        setNotice(
          'Almost there. Confirm your email from the link we just sent, then sign in.'
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free to use. Your data stays yours."
    >
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="text-muted-foreground text-xs">At least 8 characters.</p>
        </div>
        <FormError message={error} />
        <FormNotice message={notice} />
        <Button type="submit" disabled={busy} size="lg">
          {busy ? 'Creating…' : 'Create account'}
        </Button>
      </form>

      <div className="text-muted-foreground my-6 flex items-center gap-3 text-xs">
        <Separator className="flex-1" /> or <Separator className="flex-1" />
      </div>
      <OAuthButtons onError={setError} />

      <p className="text-secondary-foreground mt-8 text-center text-sm">
        Already have an account?{' '}
        <Link
          to="/login"
          search={{}}
          className="text-accent underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
