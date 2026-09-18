import type { MetadataRoute } from 'next';

import { getURL } from '@/utils/helpers';

/**
 * Only public, indexable pages belong here. Everything behind the session is
 * excluded for the same reason it is disallowed in robots.ts.
 *
 * `lastModified` is the deploy time rather than a per-page date because these
 * pages change when the code does. Articles, when they exist, should carry
 * their own real dates instead — a sitemap that claims everything changed
 * today teaches crawlers to ignore the field.
 */
const PAGES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}> = [
  { path: '', priority: 1, changeFrequency: 'monthly' },
  { path: 'about', priority: 0.8, changeFrequency: 'monthly' },
  { path: 'privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: 'terms', priority: 0.3, changeFrequency: 'yearly' }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PAGES.map(({ path, priority, changeFrequency }) => ({
    url: getURL(path),
    lastModified,
    changeFrequency,
    priority
  }));
}
