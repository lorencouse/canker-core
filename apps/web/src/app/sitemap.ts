import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/site';
import { getAllGuides } from '@/lib/guides';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    {
      url: `${siteUrl}/how-it-works`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7
    },
    {
      url: `${siteUrl}/guides`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3
    }
  ];

  const guideRoutes: MetadataRoute.Sitemap = getAllGuides().map((guide) => ({
    url: `${siteUrl}/guides/${guide.slug}`,
    lastModified: new Date(`${guide.publishedAt}T00:00:00Z`),
    changeFrequency: 'monthly' as const,
    priority: 0.6
  }));

  return [...staticRoutes, ...guideRoutes];
}
