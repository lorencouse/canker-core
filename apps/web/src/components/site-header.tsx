import Link from 'next/link';
import { Menu } from 'lucide-react';

import { appUrl, navLinks } from '@/lib/site';
import { CtaButton } from '@/components/cta-button';
import { ThemeToggle } from '@/components/theme-toggle';

function Wordmark() {
  return (
    <Link
      href="/"
      className="font-display text-foreground flex items-center gap-2.5 rounded-md text-lg font-bold tracking-tight"
      aria-label="Canker Core home"
    >
      <span
        aria-hidden="true"
        className="bg-accent-soft relative inline-flex size-6 items-center justify-center rounded-full"
      >
        <span className="bg-accent size-2.5 rounded-full" />
      </span>
      Canker Core
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="border-border bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Wordmark />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-secondary-foreground hover:bg-muted hover:text-foreground rounded-md px-3 py-2 text-sm font-medium motion-safe:transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <CtaButton href={appUrl} size="sm" className="hidden sm:inline-flex">
            Open the app
          </CtaButton>

          {/* Mobile menu: a details element keeps this a server component. */}
          <details className="group relative md:hidden">
            <summary
              className="border-border bg-card text-secondary-foreground hover:bg-muted hover:text-foreground group-open:bg-muted inline-flex size-9 cursor-pointer items-center justify-center rounded-md border"
              aria-label="Open menu"
            >
              <Menu className="size-4" aria-hidden="true" />
            </summary>
            <div className="border-border bg-card shadow-foreground/5 absolute right-0 mt-2 w-56 rounded-lg border p-1.5 shadow-lg">
              <nav aria-label="Primary mobile" className="flex flex-col">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-secondary-foreground hover:bg-muted hover:text-foreground rounded-md px-3 py-2 text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="border-border mt-1.5 border-t pt-1.5 sm:hidden">
                <CtaButton href={appUrl} size="sm" className="w-full">
                  Open the app
                </CtaButton>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
