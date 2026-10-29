import { describe, expect, it } from 'vitest';

import { PUBLISHED_ARTICLES, type Article } from '@/content/articles';
import { groupedArticles, WRITING_GROUPS } from './writing-groups';

describe('groupedArticles', () => {
  it('lists every published article exactly once', () => {
    const listed = groupedArticles().flatMap((g) =>
      g.articles.map((a) => a.slug)
    );
    expect([...listed].sort()).toEqual(
      PUBLISHED_ARTICLES.map((a) => a.slug).sort()
    );
  });

  it('names only articles that exist in the registry', () => {
    const known = new Set(PUBLISHED_ARTICLES.map((a) => a.slug));
    for (const slug of WRITING_GROUPS.flatMap((g) => g.slugs))
      expect(known).toContain(slug);
  });

  it('files an unplaced article under the last group rather than dropping it', () => {
    const stray: Article = {
      slug: 'something-new',
      title: 'New',
      heading: 'New',
      answer: 'New.',
      published: '2026-10-28',
      updated: '2026-10-28'
    };
    const groups = groupedArticles([...PUBLISHED_ARTICLES, stray]);
    expect(groups.at(-1)!.articles.map((a) => a.slug)).toContain(
      'something-new'
    );
  });
});
