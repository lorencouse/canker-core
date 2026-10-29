import type { Metadata } from 'next';
import Link from 'next/link';

import RecurrenceSketch from '@/components/marketing/RecurrenceSketch';
import {
  groupedArticles,
  type WritingGroup
} from '@/components/marketing/writing-groups';

export const metadata: Metadata = {
  title: 'Writing',
  description:
    'What the course of a mouth ulcer actually looks like — how long one lasts, how to tell whether it is healing, and what the pattern of them means.',
  alternates: { canonical: '/blog' }
};

/**
 * Each question carries a drawing from the articles it leads to: the stages
 * of one sore, a canker sore beside a cold sore, and sores returning to one
 * spot on the map. The first two are the same standalone SVGs other sites
 * embed, so the index can never show a drawing the article does not.
 */
function GroupFigure({ group }: { group: WritingGroup['key'] }) {
  if (group === 'why')
    return <RecurrenceSketch className="block h-auto w-full bg-card" />;
  const src =
    group === 'healing'
      ? '/diagrams/canker-sore-stages.svg'
      : '/diagrams/canker-sore-vs-cold-sore.svg';
  const alt =
    group === 'healing'
      ? 'The five stages of a canker sore, drawn to one scale.'
      : 'A canker sore and a cold sore drawn side by side.';
  // eslint-disable-next-line @next/next/no-img-element -- a static SVG route; next/image would only add a wrapper
  return <img src={src} alt={alt} className="block h-auto w-full" />;
}

/**
 * The writing index, grouped by the question a reader arrives with.
 *
 * On a phone it is one column: each question, its drawing, then its
 * articles. On a desktop the question and drawing hold the left of the grid
 * and stay in view while the articles run down the right, so the width that
 * used to be empty ground carries the picture.
 */
export default function BlogIndexPage() {
  const groups = groupedArticles();

  return (
    <div className="container py-12 sm:py-16 lg:py-20">
      <header className="max-w-3xl animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <h1 className="text-display">Writing</h1>
        <p className="mt-5 text-xl leading-snug sm:text-2xl">
          Every health site explains what a canker sore is. These are about the
          part that is hard to find out: what happens to one over the next
          fortnight, and whether yours is doing it.
        </p>
      </header>

      {groups.map((group) => (
        <section
          key={group.key}
          aria-labelledby={`group-${group.key}`}
          className="mt-16 grid grid-cols-1 gap-8 sm:mt-24 lg:mt-36 lg:grid-cols-12 lg:gap-12"
        >
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <h2 id={`group-${group.key}`} className="text-title">
                {group.question}
              </h2>
              <p className="prose-measure mt-3 text-lg">{group.summary}</p>
              <figure className="mt-6 animate-in fade-in-0 zoom-in-95 duration-700">
                <GroupFigure group={group.key} />
              </figure>
            </div>
          </div>

          <ul className="grid grid-cols-1 gap-8 lg:col-span-7 lg:gap-10 lg:pt-2">
            {group.articles.map((article, i) => (
              <li
                key={article.slug}
                className="animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-both duration-500"
                style={{ animationDelay: `${80 * (i + 1)}ms` }}
              >
                <h3 className="text-section">
                  <Link
                    href={`/blog/${article.slug}`}
                    className="underline-offset-4 hover:text-primary hover:underline"
                  >
                    {article.heading}
                  </Link>
                </h3>
                <p className="prose-measure mt-2 lg:text-lg">
                  {article.answer}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
