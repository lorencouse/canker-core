import type { Metadata } from 'next';
import Link from 'next/link';

import { ArticleFooter } from '@/components/marketing/article/ArticleShell';
import MouthMapExplorer from '@/components/marketing/mouth-map/MouthMapExplorer';

export const metadata: Metadata = {
  title: 'Mouth map: where canker sores turn up, site by site',
  description:
    'An interactive map of the mouth. Pick the site your sore is at — lip, cheek, gum, palate, tongue, under the tongue, or the back of the mouth — and read what the tissue there is, what keeps rubbing it, and what a sore there usually does.',
  alternates: { canonical: '/mouth-map' }
};

/**
 * The one landing page on the site, and the hub of everything about place.
 *
 * It is the product's actual mechanism, usable with no account: the same
 * artwork and the same zone hit-testing as the app, answering a question a
 * reader arrives with rather than asking them to sign up to see it. Every
 * location article links up to here and this links back down to whichever of
 * them exist, which is what makes the cluster read as one thing.
 */
export default function MouthMapPage() {
  return (
    <article className="container max-w-3xl py-12 sm:py-16">
      <h1 className="text-title">Where is it?</h1>

      <p className="mt-6 border-l-2 border-primary pl-4 text-lg text-foreground">
        Canker sores favour the soft, mobile lining inside the mouth — the inner
        lip and the cheek above all. The further a sore sits from there, the
        more likely it is to be something else or to have a cause you can point
        at, which is why the site is worth writing down before anything else
        about it.
      </p>

      <p className="mt-6 text-muted-foreground">
        Pick the site below. Each one answers the same three questions in the
        same order, so that the sites can be compared: what the tissue there is,
        what keeps rubbing it, and what a sore there usually does.
      </p>

      <MouthMapExplorer />

      <div className="prose-measure space-y-10 [&_h2]:text-subhead [&_p]:mt-3 [&_p]:text-muted-foreground">
        <section>
          <h2>Why the place is worth recording at all</h2>
          <p>
            Because it is the one piece of information that splits recurring
            sores into two different problems. Sores that keep landing within a
            few millimetres of the same point are reporting a{' '}
            <strong className="text-foreground">place</strong>: something in
            that place keeps injuring the tissue, and a dentist can often find
            it by running a fingernail along the teeth beside it. Sores that
            turn up anywhere are reporting a{' '}
            <strong className="text-foreground">time</strong>: nothing at any
            one site is causing them, so the thing to look at is the few days
            before each one.
          </p>
          <p>
            Nobody can tell those apart from memory. &ldquo;Left cheek,
            usually&rdquo; covers an area the size of a postage stamp folded
            twice, and a mechanical cause and a whole-mouth one look identical
            at that resolution.{' '}
            <Link href="/blog/why-do-i-keep-getting-canker-sores">
              The recurrence article
            </Link>{' '}
            is the long version of this, and it is the reason the map stores a
            point rather than a name.
          </p>
        </section>

        <section>
          <h2>What the map records</h2>
          <p>
            A mark on one of the three views, which is a position rather than a
            label — the site name is worked out from where the mark lands, so it
            stays true if you nudge the mark later. Then, once a day, the
            sore&rsquo;s width in millimetres and its pain out of ten. That is
            the whole record, and it is enough to answer the two questions a
            single look cannot:{' '}
            <Link href="/blog/is-my-canker-sore-healing">
              whether this one is shrinking
            </Link>{' '}
            and{' '}
            <Link href="/blog/how-long-do-canker-sores-last">
              how much of the fortnight is left
            </Link>
            .
          </p>
        </section>

        <section>
          <h2>Before you use the map, make sure it is the right map</h2>
          <p>
            Everything here is about sores on the lining <em>inside</em> the
            mouth. A sore on the lip border itself, or on the skin outside it,
            is a different condition with a different course —{' '}
            <Link href="/blog/canker-sore-vs-cold-sore">
              which side of that border it sits on decides it
            </Link>
            , and it takes one look in a mirror.
          </p>
        </section>
      </div>

      <ArticleFooter />
    </article>
  );
}
