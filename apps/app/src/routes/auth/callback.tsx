import { createRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@canker/ui';
import { rootRoute } from '@/router-base';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { AuthLayout, FormError } from '@/components/auth-layout';
import { Splash } from '@/components/splash';

/**
 * OAuth and magic-link return point. With PKCE the client library exchanges
 * the `code` query param for a session on load; we just wait for it.
 */
export const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: CallbackPage
});

function CallbackPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      void navigate({ to: '/today', search: {}, replace: true });
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const desc = params.get('error_description');
    if (desc) setError(desc);
    else if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError(error.message);
      });
    }
    const t = setTimeout(
      () => setError((e) => e ?? 'Sign-in took too long. Try again.'),
      12_000
    );
    return () => clearTimeout(t);
  }, [user, navigate]);

  if (error) {
    return (
      <AuthLayout title="Couldn't sign you in">
        <FormError message={error} />
        <Button
          className="mt-4"
          onClick={() => void navigate({ to: '/login', search: {} })}
        >
          Back to sign in
        </Button>
      </AuthLayout>
    );
  }
  return <Splash />;
}
