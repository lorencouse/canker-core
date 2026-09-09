function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export const siteUrl = stripTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cankercore.com'
);

export const appUrl = stripTrailingSlash(
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.cankercore.com'
);

export const siteName = 'Canker Core';

export const siteDescription =
  'A daily check-in for people who get recurring canker sores. Log size, pain and the factors that applied, then see which patterns show up in your own records.';

export const disclaimer =
  'Canker Core helps you keep records. It does not diagnose or treat any condition. See a dentist or doctor about a sore that lasts more than two weeks, is unusually large, or comes with fever.';

export const navLinks = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/guides', label: 'Guides' },
  { href: '/pricing', label: 'Pricing' }
] as const;
