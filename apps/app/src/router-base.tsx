import {
  createRootRouteWithContext,
  createRoute,
  Outlet,
  redirect
} from '@tanstack/react-router';
import type { AuthState } from '@/lib/auth';
import { AppShell } from '@/components/app-shell';

/**
 * Code-based routes (no generator step) so the app typechecks before any
 * build tooling runs. Page files import `authedRoute`/`rootRoute` and define
 * their own route; `router.tsx` assembles the tree.
 */

export interface RouterContext {
  auth: AuthState;
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />
});

/** Everything behind sign-in lives under this pathless layout. */
export const authedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authed',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      // `replace` so the guarded page does not sit in history waiting to
      // bounce the user straight back here on the next Back press.
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
        replace: true
      });
    }
  },
  component: AppShell
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ context }) => {
    throw redirect({
      to: context.auth.user ? '/today' : '/login',
      search: {},
      replace: true
    });
  }
});
