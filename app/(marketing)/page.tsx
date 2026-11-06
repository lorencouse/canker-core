import type { Metadata } from 'next';
import Link from 'next/link';

import Kanko from '@/components/kanko/Kanko';
import type { KankoMood } from '@/components/kanko/moods';
import MouthMapHero from '@/components/marketing/MouthMapHero';
import SeverityScale from '@/components/marketing/SeverityScale';
import StartButton from '@/components/marketing/StartButton';
import { JsonLd, softwareApplicationSchema } from '@/components/seo/JsonLd';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  alternates: { canonical: '/' }
};

/**
 * Healing is genuinely a sequence, so a timeline is the honest structure here
 * rather than decorative step numbers.
 */
const TIMELINE: {
  when: string;
  title: string;
  body: string;
  mood: KankoMood;
}[] = [
  {
    when: 'Day 0',
    title: 'Mark it',
    body: 'Tap the spot on the mouth map. Set how wide it is and how much it hurts.',
    mood: 'point'
  },
  {
    when: 'Day 2',
    title: 'Update it',
    body: 'Come back and move the two sliders. Every reading is kept, not overwritten.',
    mood: 'phone'
  },
  {
    when: 'Day 7',
    title: 'See it close',
    body: 'The history chart shows the size falling. If it is not falling, you will see that too.',
    mood: 'magnify'
  }
];

export default function HomePage() {
  return (
    <>
      <JsonLd schema={softwareApplicationSchema} />
      <section className="container grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div>
          {/* Kanko waves beside the headline rather than above it, so the
              promise is still the first thing read. A wrapped heading's box
              stays as wide as the room it was given, which left Kanko far
              from the words, so the box is capped at the widest line it
              will set: "it's healing." (about 5em at this face and
              tracking) where it runs to three lines, "Know whether" (about
              6.7em) on a tablet, where it fits in two. The headline is the
              page's largest paint; Kanko loads eagerly so it lands with it. */}
          <div className="flex items-end gap-3 sm:gap-4">
            <h1 className="min-w-0 max-w-[5.2em] text-display sm:max-w-[6.8em] lg:max-w-[5.2em]">
              Know whether it&rsquo;s healing.
            </h1>
            <Kanko
              mood="hello"
              size={144}
              priority
              className="size-24 shrink-0 sm:size-36"
            />
          </div>
          <p className="prose-measure mt-6 text-lg text-muted-foreground">
            Canker sores all feel like they last forever. Mark where one is, log
            its size and pain each day, and find out whether it is actually
            shrinking &mdash; and whether anything you tried made a difference.
          </p>
          {/* Stacked and full-width on a phone: these are the only two
              things to do on this screen, and a thumb should not have to
              aim at a pill floating in the middle of a line. */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <StartButton className="sm:h-11 sm:px-8" />
            <Button
              asChild
              variant="ghost"
              size="touch"
              className="sm:h-11 sm:px-8"
            >
              <Link href="/about">How it works</Link>
            </Button>
          </div>
        </div>

        <MouthMapHero />
      </section>

      <section className="container py-8 sm:py-12">
        <div className="rounded-worksheet border border-border bg-card p-5 sm:p-8">
          <h2 className="text-section">One scale, used everywhere</h2>
          <p className="prose-measure mt-2 text-muted-foreground">
            Pain is the only thing in Canker Core that gets a colour. The same
            ramp appears on the map, in the history chart, and in every table,
            so a glance tells you how bad a day was.
          </p>
          <div className="mt-6">
            <SeverityScale />
          </div>
        </div>
      </section>

      <section className="container py-8 sm:py-12 lg:py-16">
        <h2 className="text-title">A sore, from first twinge to gone</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {TIMELINE.map((step) => (
            <li
              key={step.when}
              className="relative border-t border-border pt-5"
            >
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <span className="tabular text-sm font-semibold text-primary">
                    {step.when}
                  </span>
                  <h3 className="mt-1 text-subhead">{step.title}</h3>
                </div>
                <Kanko
                  mood={step.mood}
                  size={96}
                  className="size-24 shrink-0"
                />
              </div>
              <p className="mt-2 text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container pb-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-worksheet border border-border bg-card p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-section">Start with the one you have now</h2>
            <p className="prose-measure mt-2 text-muted-foreground">
              It takes about fifteen seconds to log the first reading.
            </p>
          </div>
          <StartButton className="w-full sm:h-11 sm:w-auto sm:px-8" />
        </div>
      </section>
    </>
  );
}
