import Link from 'next/link';
import { PropsWithChildren } from 'react';

import Logo from '@/components/icons/Logo';
import ModeToggle from '@/components/mode-toggle';

/**
 * Sign-in stands alone: no navbar, no tab bar, nothing to navigate to.
 *
 * On a phone this is the app's first screen, and it is the one place where a
 * centred card on an empty ground is right — there is a single decision to
 * make and everything else would be a distraction from it.
 */
export default function SignInLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-[100dvh] flex-col safe-x">
      <div className="flex items-center justify-between px-4 pt-[calc(var(--safe-top)+1rem)]">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md text-foreground"
        >
          <Logo size={26} />
          <span className="font-display text-base font-semibold tracking-tight">
            Canker Core
          </span>
        </Link>
        <ModeToggle />
      </div>

      <main
        id="main"
        className="flex flex-1 items-center justify-center px-4 py-10"
      >
        {/*
          The keyboard covers the lower half of a phone, so the card is
          bottom-padded by the keyboard height rather than left to be hidden
          behind it.
        */}
        <div className="w-full max-w-md pb-[var(--keyboard-h)]">{children}</div>
      </main>
    </div>
  );
}
