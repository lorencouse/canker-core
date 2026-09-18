/**
 * The article registry.
 *
 * Articles are `page.mdx` files in their own route folder, so Next resolves
 * the routes; this list is what everything *else* needs — the index, the
 * sitemap, the JSON-LD, the "last reviewed" line. It is hand-maintained rather
 * than globbed off the filesystem so that adding an article is a deliberate
 * diff and the dates cannot drift to "whenever the build ran".
 *
 * `answer` is the direct answer the page leads with, repeated here because it
 * is also the meta description and the FAQ answer in the structured data.
 * Keep it under fifty words: it is what a featured snippet or an AI overview
 * lifts, and anything longer gets truncated mid-sentence.
 */
export type Article = {
  slug: string;
  title: string;
  /** The <title> and H1 can differ; this is the H1. */
  heading: string;
  answer: string;
  published: string;
  updated: string;
  /** Question-shaped headings this page is written to answer, for FAQ markup. */
  faqs?: Array<{ question: string; answer: string }>;
};

export const ARTICLES: Article[] = [
  {
    slug: 'how-long-do-canker-sores-last',
    title: 'How long do canker sores last? A day-by-day timeline',
    heading: 'How long a canker sore actually lasts',
    answer:
      'Most canker sores heal in 7 to 14 days. A small one under 5mm is usually gone in about a week; a larger one can take two weeks or more. Pain peaks in the first three days and fades well before the sore closes.',
    published: '2026-09-18',
    updated: '2026-09-18',
    faqs: [
      {
        question: 'How long does a canker sore last?',
        answer:
          'Seven to fourteen days for most people. Sores under 5mm across typically close in about a week; larger ones take two weeks or longer.'
      },
      {
        question: 'How long does canker sore pain last?',
        answer:
          'Pain usually peaks within the first three days and eases from day four onward, well before the sore has finished closing. Pain fading is not the same as healing.'
      },
      {
        question: 'When is a canker sore lasting too long?',
        answer:
          'Past three weeks. A sore that has not begun shrinking by two weeks, or that is still growing, is worth showing to a dentist.'
      }
    ]
  },
  {
    slug: 'is-my-canker-sore-healing',
    title: 'How to tell whether a canker sore is healing',
    heading: 'How to tell whether a canker sore is healing',
    answer:
      'You cannot tell from one look. A healing sore gets narrower, its edge softens from angry red to pale pink, and it hurts less. The only reliable test is to measure its width twice, two days apart, and compare.',
    published: '2026-09-18',
    updated: '2026-09-18',
    faqs: [
      {
        question: 'How do you know when a canker sore is healing?',
        answer:
          'It narrows. The white or yellow centre shrinks, the red halo around it fades to pink, and the pain drops. Measuring the width two days apart is the only way to be sure.'
      },
      {
        question: 'Do canker sores get worse before they get better?',
        answer:
          'Often, yes. A sore usually grows and hurts most over the first two to three days, then holds steady before it starts closing. Getting worse early is normal; getting worse after day four is not.'
      },
      {
        question: 'What does a healing canker sore look like?',
        answer:
          'Smaller, flatter, and paler. The crater fills in from the edges, so the white centre shrinks before the sore disappears entirely.'
      }
    ]
  }
];

export const articleBySlug = (slug: string) =>
  ARTICLES.find((a) => a.slug === slug);
