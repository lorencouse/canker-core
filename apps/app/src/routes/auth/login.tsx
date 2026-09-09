import { createRoute, Link, redirect } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { emailSchema } from '@canker/core';
import { Button, Input, Label, Separator } from '@canker/ui';
import { rootRoute } from '@/router-base';
import { authRedirectUrl, supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import { AuthLayout, FormError, FormNotice } from '@/components/auth-layout';
import { DemoSignedInNotice } from '@/components/demo-mode';
import { OAuthButtons } from '@/components/oauth-buttons';

/** Only ever bounce back to a path inside this app, never to another origin. */
function isInternalPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//');
}

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s.redirect === 'string' && isInternalPath(s.redirect)
      ? { redirect: s.redirect }
      : {},
  beforeLoad: ({ context, search }) => {
    if (!context.auth.user) return;
    // `redirect` is a full href (pathname + search); `to` only takes a path,
    // so it has to go through `href` or the query string ends up in the path.
    if (search.redirect) throw redirect({ href: search.redirect, replace: true });
    throw redirect({ to: '/today', search: {}, replace: true });
  },
  component: LoginPage
});

function LoginPage() {
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Demo mode has no accounts; the guard above normally redirects first.
  if (env.demo) return <DemoSignedInNotice />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success)
      return setError(parsed.error.issues[0]?.message ?? 'Enter a valid email');
    setBusy(true);
    try {
      if (mode === 'password') {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data,
          password
        });
        if (error) return setError(error.message);
        // The auth listener updates the router context, which re-runs this
        // route's `beforeLoad` and performs the redirect. Navigating here too
        // would race that with a stale context and bounce through /today.
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: parsed.data,
          options: { emailRedirectTo: authRedirectUrl(), shouldCreateUser: true }
        });
        if (error) return setError(error.message);
        setNotice('Check your email for a sign-in link. You can close this tab.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to log today's check-in.">
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
        {mode === 'password' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/forgot-password"
                className="text-accent text-xs underline-offset-2 hover:underline"
              >
                Forgot it?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}
        <FormError message={error} />
        <FormNotice message={notice} />
        <Button type="submit" disabled={busy} size="lg">
          {busy ? 'Signing in…' : mode === 'password' ? 'Sign in' : 'Email me a link'}
        </Button>
        <button
          type="button"
          className="text-secondary-foreground text-sm underline-offset-2 hover:underline"
          onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
        >
          {mode === 'password' ? 'Use a magic link instead' : 'Use a password instead'}
        </button>
      </form>

      <div className="text-muted-foreground my-6 flex items-center gap-3 text-xs">
        <Separator className="flex-1" /> or <Separator className="flex-1" />
      </div>
      <OAuthButtons onError={setError} />

      <p className="text-secondary-foreground mt-8 text-center text-sm">
        New here?{' '}
        <Link to="/signup" className="text-accent underline-offset-2 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
