'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import Logo from '@/components/icons/Logo';
import ModeToggle from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { SignOut } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import { cn } from '@/utils/cn';
import { APP_NAV, isActiveTab } from './nav-items';

/**
 * The app's top bar, in two forms behind one component.
 *
 * On a phone it is a title bar: the current screen's name, centred, with the
 * navigation living in the tab bar below. On a desktop the tab bar is gone,
 * so the same strip carries the wordmark and the full set of links.
 *
 * Fixed in both cases — the mouth map is a pan-and-zoom surface, and a
 * sticky bar that scrolls away mid-gesture is worse than no bar.
 */
export default function AppTopBar() {
  const pathname = usePathname();
  const clientRouter = useRouter();
  const router = getRedirectMethod() === 'client' ? clientRouter : null;

  const current = APP_NAV.find(({ href }) => isActiveTab(pathname, href));
  const onMap = isActiveTab(pathname, '/my-sores');

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40',
        'border-b border-border bg-background/90 backdrop-blur-md',
        'safe-t safe-x'
      )}
    >
      <div className="mx-auto flex h-[var(--app-bar-h)] max-w-6xl items-center gap-3 px-4 lg:px-6">
        {/* Phone: the screen's own name, which is the only thing a title bar
            has to say when the tabs are visible two inches below. Not a
            heading — it labels the chrome, and each screen carries its own
            h1 at every width. */}
        <p className="flex-1 truncate font-display text-base font-semibold tracking-tight lg:hidden">
          {current?.label ?? 'Canker Core'}
        </p>

        {/* Desktop: wordmark plus inline navigation. */}
        <Link
          href="/my-sores"
          className="hidden items-center gap-2.5 rounded-md text-foreground lg:flex"
        >
          <Logo size={26} />
          <span className="font-display text-base font-semibold tracking-tight">
            Canker Core
          </span>
        </Link>

        <nav
          aria-label="Main"
          className="hidden flex-1 items-center gap-1 lg:flex"
        >
          {APP_NAV.map(({ href, label }) => {
            const active = isActiveTab(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          {/*
            Marking a sore is the one urgent thing this app does, and it was
            reachable only by going to the map and finding a button there.
            It is an action, not a destination, so it lives in the chrome
            rather than taking a fifth tab — and it is hidden on the map
            itself, where the action bar already owns it.
          */}
          {!onMap && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/my-sores?add" aria-label="Mark a new sore">
                <Plus aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">New sore</span>
              </Link>
            </Button>
          )}
          <ModeToggle />
          <form
            onSubmit={(e) => handleRequest(e, SignOut, router)}
            className="hidden lg:block"
          >
            <input type="hidden" name="pathName" value={pathname} />
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
