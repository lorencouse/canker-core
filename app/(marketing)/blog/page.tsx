import type { Metadata } from 'next';
import Link from 'next/link';

import { ARTICLES } from '@/content/articles';

export const metadata: Metadata = {
  title: 'Writing',
  description:
    'What the course of a mouth ulcer actually looks like — how long one lasts, how to tell whether it is healing, and what the pattern of them means.',
  alternates: { canonical: '/blog' }
};

export default function BlogIndexPage() {
  // Newest first, and stable: the registry order is editorial, the sort is not.
  const articles = [...ARTICLES].sort((a, b) =>
    b.published.localeCompare(a.published)
  );

  return (
    <>
      <h1 className="text-title">Writing</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Every health site explains what a canker sore is. These are about the
        part that is actually hard to find out: what happens to one over the
        next fortnight, and whether yours is doing it.
      </p>

      <ul className="mt-12 space-y-10">
        {articles.map((article) => (
          <li key={article.slug} className="border-t border-border pt-6">
            <h2 className="text-subhead">
              <Link
                href={`/blog/${article.slug}`}
                className="hover:text-primary"
              >
                {article.heading}
              </Link>
            </h2>
            <p className="mt-2 text-muted-foreground">{article.answer}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
