'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

import Logo from '@/components/icons/Logo';
import ModeToggle from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { SignOut } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import { cn } from '@/utils/cn';
import { useSession } from '@/lib/auth-client';

const signedInLinks = [
  { href: '/my-sores', label: 'Map' },
  { href: '/insights', label: 'Insights' },
  { href: '/profile', label: 'Settings' }
];

const signedOutLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' }
];

export default function Navlinks() {
  // Resolved in the browser so the pages around this header can stay static.
  // Until it resolves the header is the signed-out one, which is both what a
  // crawler should see and the correct answer for most visitors.
  const { data: session } = useSession();
  const signedIn = Boolean(session?.user);

  const pathname = usePathname();
  const clientRouter = useRouter();
  const router = getRedirectMethod() === 'client' ? clientRouter : null;
  const [menuOpen, setMenuOpen] = useState(false);

  // Any navigation closes the mobile sheet, including a back/forward step.
  useEffect(() => setMenuOpen(false), [pathname]);

  const links = signedIn ? signedInLinks : signedOutLinks;

  const navLink = (href: string, label: string, onNavigate?: () => void) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={cn(
          // The desktop row is compact; the mobile sheet's rows are list
          // items and need to be 44px tall, which the md: split gives them.
          'flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors md:py-2',
          active
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        {label}
      </Link>
    );
  };

  const signOutForm = (className?: string) => (
    <form
      onSubmit={(e) => handleRequest(e, SignOut, router)}
      className={className}
    >
      <input type="hidden" name="pathName" value={pathname} />
      <Button type="submit" variant="ghost" size="sm">
        Sign out
      </Button>
    </form>
  );

  return (
    <nav className="flex h-16 items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <Link
          href={signedIn ? '/my-sores' : '/'}
          className="flex items-center gap-2.5 rounded-md text-foreground"
        >
          <Logo size={28} />
          <span className="font-display text-base font-semibold tracking-tight">
            Canker Core
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ href, label }) => navLink(href, label))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            signOutForm()
          ) : (
            <Button asChild size="sm">
              <Link href="/signin">Sign in</Link>
            </Button>
          )}
        </div>

        <ModeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
          <span className="sr-only">
            {menuOpen ? 'Close menu' : 'Open menu'}
          </span>
        </Button>
      </div>

      {menuOpen && (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-16 flex flex-col gap-1 border-b border-border bg-background p-4 shadow-lg md:hidden"
        >
          {links.map(({ href, label }) =>
            navLink(href, label, () => setMenuOpen(false))
          )}
          <div className="mt-2 border-t border-border pt-3">
            {signedIn ? (
              signOutForm('flex')
            ) : (
              <Button asChild size="touch" className="w-full">
                <Link href="/signin" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
