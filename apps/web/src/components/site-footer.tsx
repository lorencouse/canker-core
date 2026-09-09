import Link from 'next/link';

import { appUrl, disclaimer, navLinks } from '@/lib/site';

const secondaryLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' }
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-card border-t">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <p className="font-display text-foreground text-lg font-bold tracking-tight">
              Canker Core
            </p>
            <p className="text-secondary-foreground max-w-sm text-sm leading-relaxed">
              A daily check-in for people who get recurring canker sores. Log in under a
              minute, then see what your own records say.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
            <p className="text-foreground font-medium">Site</p>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-secondary-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <a href={appUrl} className="text-secondary-foreground hover:text-foreground">
              Open the app
            </a>
          </nav>

          <nav aria-label="Legal" className="flex flex-col gap-2 text-sm">
            <p className="text-foreground font-medium">Legal</p>
            {secondaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-secondary-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-border text-muted-foreground mt-10 flex flex-col gap-3 border-t pt-6 text-xs leading-relaxed">
          <p>{disclaimer}</p>
          <p>&copy; {year} Canker Core</p>
        </div>
      </div>
    </footer>
  );
}
