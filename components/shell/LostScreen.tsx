import Link from 'next/link';
import type { ReactNode } from 'react';

import Logo from '@/components/icons/Logo';
import Kanko from '@/components/kanko/Kanko';
import { Button } from '@/components/ui/button';

/**
 * The page for a wrong turn: an address that leads nowhere, or a screen that
 * failed to draw. It stands alone like sign-in, with only the logo to get
 * home by, because it can be reached from the site, the app or a stale link
 * and cannot know which chrome would be right.
 */
export default function LostScreen({
  title,
  body,
  action
}: {
  title: string;
  body: string;
  /** The first thing to try; a link home always follows it. */
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col safe-x">
      <div className="px-4 pt-[calc(var(--safe-top)+1rem)]">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 rounded-md text-foreground"
        >
          <Logo size={26} wordmark />
        </Link>
      </div>
      <main
        id="main"
        className="flex flex-1 items-center justify-center px-4 pb-[calc(var(--safe-bottom)+2.5rem)] pt-10"
      >
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <Kanko mood="lost" size={144} priority className="size-36" />
          <h1 className="mt-4 text-section">{title}</h1>
          <p className="prose-measure mt-2 text-muted-foreground">{body}</p>
          <div className="mt-8 flex w-full flex-col gap-3">
            {action}
            <Button asChild variant={action ? 'ghost' : 'default'} size="touch">
              <Link href="/">Go to the home page</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
