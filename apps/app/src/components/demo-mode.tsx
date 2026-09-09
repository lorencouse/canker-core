import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@canker/ui';
import { resetDemoState } from '@/lib/demo/backend';
import { AuthLayout } from '@/components/auth-layout';

/**
 * Slim, permanent reminder that nothing here reaches a server, plus the one
 * affordance demo mode needs: throwing local edits away.
 */
export function DemoBanner() {
  const qc = useQueryClient();

  function reset() {
    resetDemoState();
    void qc.invalidateQueries();
  }

  return (
    <div
      role="status"
      className="border-border bg-muted text-muted-foreground flex items-center justify-center gap-3 border-b px-3 py-1 text-xs"
    >
      <span>Demo data · nothing is saved to a server</span>
      <button
        type="button"
        onClick={reset}
        className="text-accent font-medium underline-offset-2 hover:underline"
      >
        Reset
      </button>
    </div>
  );
}

/** Stands in for the sign-in and sign-up forms while demo mode is on. */
export function DemoSignedInNotice() {
  return (
    <AuthLayout
      title="Demo mode — you're already signed in"
      subtitle="This build runs on a local sample dataset. There is no account to create."
    >
      <Button asChild size="lg">
        <Link to="/today" search={{}}>
          Go to Today
        </Link>
      </Button>
    </AuthLayout>
  );
}
