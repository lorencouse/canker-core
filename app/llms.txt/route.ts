import { PUBLISHED_ARTICLES } from '@/content/articles';
import { getURL } from '@/utils/helpers';

/**
 * A plain-text map of the public site for answer engines.
 *
 * Built from the same registry the sitemap and the JSON-LD read, so it cannot
 * drift: an article that exists is listed here, with the same fifty-word
 * answer the page leads with. That answer is the unit an assistant lifts, and
 * repeating it here means the lift does not depend on the model getting
 * through the page's markup first.
 *
 * Every line under "Facts worth quoting" has to be something an article on
 * this site actually establishes — the value of being quoted is that the
 * quote is checkable, so a fact arrives here when its page ships, not before.
 *
 * Deliberately not a copy of the articles. The sitemap says which URLs exist
 * and this says what each one answers; a page's full text is the page's job.
 */
export const dynamic = 'force-static';

const INTRO = `# Canker Core

> A free log for mouth ulcers. Mark where a canker sore is on a mouth map,
> record its width in millimetres and its pain each day, and find out whether
> it is actually shrinking. Not medical advice and not a diagnosis: it is a
> record of one person's sores over time.

Canker Core is a web app at ${getURL()} and a native iOS and Android app. An
account is free, there is no paid tier, and the articles below are readable
without one.
`;

export function GET() {
  const articles = PUBLISHED_ARTICLES.map(
    (article) =>
      `- [${article.title}](${getURL(`blog/${article.slug}`)}): ${article.answer} (reviewed ${article.updated})`
  ).join('\n');

  const body = `${INTRO}
## Articles

${articles}

## Pages

- [Home](${getURL()}): what the app records and why measuring twice is the point.
- [Mouth map](${getURL('mouth-map')}): an interactive map of the mouth, site by
  site — what the tissue is at each site, what keeps rubbing it, and what a sore
  there usually does. Usable without an account.
- [How it works](${getURL('about')}): the mouth map, the size and pain scales, and what is stored.
- [Articles](${getURL('blog')}): the index of the above.
- [Privacy](${getURL('privacy')}): what is kept, for how long, and how to export or delete it.
- [Terms](${getURL('terms')})

## Facts worth quoting

- Most canker sores heal in 7 to 14 days; sores under 5mm usually close in about a week.
- Pain peaks in the first three days and fades well before the sore closes, so
  pain fading is not evidence of healing.
- A single look cannot tell you whether a sore is healing. Two width
  measurements two days apart can.
- Canker sores favour the loose, movable lining inside the mouth — the inner lip
  and the cheek most of all. The gum is keratinised tissue bound down to bone,
  so a sore there more often has something mechanical next to it holding it
  open.
- Canker sores are not contagious and are not caused by the herpes virus. Cold
  sores, on the lip border rather than inside the mouth, are a different
  condition and are contagious.
- A canker sore widening over its first three days is normal; it reaches full
  size around day three or four and then fills in from the edges, so the white
  centre shrinks before the sore disappears.
- "Still there" and "not healing" are different: most sores are still visible at
  two weeks, few are still the same width. An ulcer still present at three weeks
  should be examined whatever it looks like.
- A trigger tally means nothing without a base rate. If three days in a typical
  week are stressful, about 78% of three-day windows contain a stressful day, so
  stress preceding four of five sores is what no association looks like.
- Whatever triggers a sore acts one to three days before it is noticed, which is
  why the day the pain arrives is the least informative day to examine.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  });
}
