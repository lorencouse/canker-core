import Link from 'next/link';

import Logo from '@/components/icons/Logo';
import GitHub from '@/components/icons/GitHub';
import ExternalLink from './ExternalLink';

const productLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/my-sores', label: 'Mouth map' },
  { href: '/insights', label: 'Insights' }
];

const legalLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' }
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-background sm:mt-24">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-foreground"
          >
            <Logo size={26} />
            <span className="font-display text-base font-semibold tracking-tight">
              Canker Core
            </span>
          </Link>
          <p className="prose-measure mt-3 text-sm text-muted-foreground">
            A private log for recurring mouth ulcers. Your sores stay on your
            own account.
          </p>
        </div>

        <FooterColumn title="Product" links={productLinks} />
        <FooterColumn title="Legal" links={legalLinks} />
      </div>

      <div className="safe-b border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} Canker Core. Not medical advice.
          </span>
          <div className="flex items-center gap-4">
            <ExternalLink
              href="https://www.lorencouse.com"
              className="rounded-md transition-colors hover:text-foreground"
            >
              Built by Loren Couse
            </ExternalLink>
            <ExternalLink
              href="https://github.com/couselm"
              aria-label="Canker Core on GitHub"
              className="flex size-11 items-center justify-center rounded-md transition-colors hover:text-foreground sm:size-auto"
            >
              <GitHub />
            </ExternalLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
