'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';

/**
 * The home page's primary call to action.
 *
 * This is a client component purely so the page around it can stay static.
 * Reading the session on the server to pick the label forced the whole
 * marketing route dynamic, which meant a Postgres round trip on every crawl
 * of the most important page on the site.
 *
 * The signed-out copy is what renders in the HTML, so that is what a crawler
 * and a first-time visitor both see; the label swaps only once the session
 * resolves for someone who already has one.
 */
export default function StartButton({ className }: { className?: string }) {
  const { data: session } = useSession();
  const signedIn = Boolean(session?.user);

  return (
    <Button asChild size="touch" className={className}>
      <Link href={signedIn ? '/my-sores' : '/signin/signup'}>
        {signedIn ? 'Open your map' : 'Start tracking'}
      </Link>
    </Button>
  );
}
