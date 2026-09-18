import type { MetadataRoute } from 'next';

import { ARTICLES } from '@/content/articles';
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
  { path: 'blog', priority: 0.7, changeFrequency: 'weekly' },
  { path: 'privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: 'terms', priority: 0.3, changeFrequency: 'yearly' }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    ...PAGES.map(({ path, priority, changeFrequency }) => ({
      url: getURL(path),
      lastModified,
      changeFrequency,
      priority
    })),
    // Articles carry their own real dates. A sitemap that claims every page
    // changed at deploy time teaches crawlers to ignore the field, and the
    // whole point of it is to say when a page genuinely last changed.
    ...ARTICLES.map((article) => ({
      url: getURL(`blog/${article.slug}`),
      lastModified: new Date(`${article.updated}T00:00:00Z`),
      changeFrequency: 'yearly' as const,
      priority: 0.9
    }))
  ];
}
