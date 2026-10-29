import { PUBLISHED_ARTICLES, type Article } from '@/content/articles';

/**
 * The writing index, grouped by the question a reader arrives with rather
 * than by date. Someone with a sore wants "is it healing?" answered, not the
 * newest post; the three questions are the three reasons people search.
 *
 * Order inside a group is editorial: the page that answers the question most
 * directly comes first.
 */
export type WritingGroup = {
  key: 'healing' | 'what' | 'why';
  question: string;
  /** One sentence on what the group answers. */
  summary: string;
  slugs: string[];
};

export const WRITING_GROUPS: WritingGroup[] = [
  {
    key: 'healing',
    question: 'Is it healing?',
    summary:
      'What a sore does over its fortnight, how to read yours against it, and when the course has run long.',
    slugs: [
      'is-my-canker-sore-healing',
      'how-long-do-canker-sores-last',
      'canker-sore-stages',
      'canker-sore-keeps-getting-bigger',
      'canker-sore-wont-go-away'
    ]
  },
  {
    key: 'what',
    question: 'What is it, and where?',
    summary:
      'Telling a canker sore from the things it is mistaken for, and what its place in the mouth changes.',
    slugs: [
      'canker-sore-vs-cold-sore',
      'are-canker-sores-herpes',
      'canker-sore-on-gum',
      'canker-sore-in-throat'
    ]
  },
  {
    key: 'why',
    question: 'Why does it keep happening?',
    summary:
      'Where the sores land and what came the days before: the two records that point at a cause.',
    slugs: [
      'why-do-i-keep-getting-canker-sores',
      'stress-and-canker-sores',
      'canker-sores-and-your-period'
    ]
  }
];

/**
 * The groups with their published articles. Anything published but not yet
 * placed in a group joins the last one, so a new article can never fall off
 * the index because nobody filed it.
 */
export function groupedArticles(
  articles: Article[] = PUBLISHED_ARTICLES
): Array<WritingGroup & { articles: Article[] }> {
  const bySlug = new Map(articles.map((a) => [a.slug, a]));
  const placed = new Set(WRITING_GROUPS.flatMap((g) => g.slugs));
  const unplaced = articles.filter((a) => !placed.has(a.slug));
  return WRITING_GROUPS.map((group, i) => ({
    ...group,
    articles: [
      ...group.slugs.flatMap((slug) => bySlug.get(slug) ?? []),
      ...(i === WRITING_GROUPS.length - 1 ? unplaced : [])
    ]
  }));
}
