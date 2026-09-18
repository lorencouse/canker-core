import Link from 'next/link';

import { JsonLd } from '@/components/seo/JsonLd';
import { Button } from '@/components/ui/button';
import { articleBySlug } from '@/content/articles';
import { getURL } from '@/utils/helpers';

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });

/**
 * The top of an article: heading, the direct answer, the dates, and the
 * structured data.
 *
 * The answer sits in a bordered block directly under the H1 and before any
 * preamble, because that is the part that gets extracted — by a featured
 * snippet, by an AI overview, and by whatever reads the page next. Burying it
 * under three paragraphs of throat-clearing is the most common way a page that
 * deserves the answer box fails to get it.
 */
export function ArticleHeader({ slug }: { slug: string }) {
  const article = articleBySlug(slug);
  if (!article) throw new Error(`No registry entry for article "${slug}"`);

  const url = getURL(`blog/${slug}`);

  return (
    <>
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          '@id': `${url}#article`,
          headline: article.title,
          description: article.answer,
          datePublished: article.published,
          dateModified: article.updated,
          mainEntityOfPage: url,
          publisher: { '@id': getURL('#organization') },
          inLanguage: 'en'
        }}
      />
      {article.faqs && (
        <JsonLd
          schema={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            '@id': `${url}#faq`,
            mainEntity: article.faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer }
            }))
          }}
        />
      )}

      <h1 className="text-title">{article.heading}</h1>

      <p className="mt-6 border-l-2 border-primary pl-4 text-lg text-foreground">
        {article.answer}
      </p>

      <p className="tabular mt-6 text-sm text-muted-foreground">
        <time dateTime={article.published}>
          {formatDate(article.published)}
        </time>
        {article.updated !== article.published && (
          <>
            {' · updated '}
            <time dateTime={article.updated}>
              {formatDate(article.updated)}
            </time>
          </>
        )}
      </p>
    </>
  );
}

/**
 * The bottom of an article: the disclaimer, then the one thing to do next.
 *
 * The disclaimer is above the call to action deliberately. It is not
 * boilerplate to be scrolled past — on a page about whether something in your
 * mouth is healing, "this is a log, not a diagnosis" is the honest framing of
 * what we are offering, and putting it after the button would read as fine
 * print.
 */
export function ArticleFooter() {
  return (
    <div className="mt-16 space-y-6">
      <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Canker Core is a log, not a diagnosis. Nothing here is medical advice. A
        sore that has not started shrinking after two weeks, keeps coming back
        in the same spot, or comes with a fever or a rash is worth showing to a
        dentist or doctor.
      </p>

      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-subhead">Find out instead of guessing</h2>
          <p className="mt-1 text-muted-foreground">
            Mark the sore, log its width and pain, and compare tomorrow. About
            fifteen seconds.
          </p>
        </div>
        <Button
          asChild
          size="touch"
          className="w-full sm:h-11 sm:w-auto sm:px-8"
        >
          <Link href="/signin/signup">Start tracking</Link>
        </Button>
      </div>
    </div>
  );
}
