import { createRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@canker/ui';
import { rootRoute } from '@/router-base';
import { useAuth } from '@/lib/auth';
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
    // The client runs with `detectSessionInUrl`, so it has already consumed
    // the `code` param and the PKCE verifier. A second exchangeCodeForSession
    // here would always fail with "code verifier should be non-empty", so we
    // only watch for an error handed back by the provider and otherwise wait
    // for the auth listener to report the session.
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const desc = params.get('error_description') ?? hash.get('error_description');
    if (desc) {
      setError(desc);
      return;
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
