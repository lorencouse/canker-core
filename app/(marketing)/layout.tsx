import { PropsWithChildren, Suspense } from 'react';

import Footer from '@/components/ui/Footer';
import Navbar from '@/components/ui/Navbar';

/**
 * The public site: home, about, and the legal pages.
 *
 * These keep a conventional website shape — a scrolling page between a
 * navbar and a footer — because that is what someone arriving from a search
 * result expects. The app shell starts at sign-in.
 */
export default function MarketingLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar />
      <main id="main" className="flex-1">
        <Suspense fallback={<MarketingSkeleton />}>{children}</Suspense>
      </main>
      <Footer />
    </div>
  );
}

function MarketingSkeleton() {
  return (
    <div className="container space-y-4 py-16" aria-busy="true">
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
