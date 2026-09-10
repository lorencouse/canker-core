import { PropsWithChildren, Suspense } from 'react';

import AppTopBar from '@/components/shell/AppTopBar';
import TabBar from '@/components/shell/TabBar';

/**
 * The signed-in app.
 *
 * Chrome is fixed top and bottom and the content scrolls between them, which
 * is the layout every native app uses and the one the Capacitor webview
 * behaves best under: no sticky element re-layouts as the address bar
 * collapses, and the tab bar cannot be scrolled off the screen.
 *
 * There is no footer here. Marketing links inside a signed-in app are noise,
 * and on a phone they would sit directly under the tab bar.
 */
export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-[100dvh]">
      <AppTopBar />
      <main id="main" className="app-scroll">
        <Suspense fallback={<AppSkeleton />}>{children}</Suspense>
      </main>
      <TabBar />
    </div>
  );
}

function AppSkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl space-y-4 px-4 py-6 lg:px-6"
      aria-busy="true"
    >
      <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
      <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
      <div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
