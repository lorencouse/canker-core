import type { Metadata } from 'next';

import Kanko from '@/components/kanko/Kanko';
import type { KankoMood } from '@/components/kanko/moods';
import MouthMapHero from '@/components/marketing/MouthMapHero';
import SeverityScale from '@/components/marketing/SeverityScale';
import StartButton from '@/components/marketing/StartButton';
import StoreBadges from '@/components/marketing/StoreBadges';
import TodayPhone from '@/components/marketing/TodayPhone';
import { JsonLd, softwareApplicationSchema } from '@/components/seo/JsonLd';
import { APP_STORE_URL } from '@/utils/app-stores';

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
    when: 'Every day',
    title: 'Check in',
    body: 'One minute: today’s size and pain, then what you ate, how you slept and what you tried.',
    mood: 'phone'
  },
  {
    when: 'Day 7 and on',
    title: 'See the pattern',
    body: 'Watch it shrink, and see what tends to come before a new one.',
    mood: 'magnify'
  }
];

export default function HomePage() {
  return (
    <>
      <JsonLd schema={softwareApplicationSchema} />
      <section className="fold-shell fold-split container grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-16 lg:py-24">
        <div>
          {/* Kanko waves beside the headline rather than above it, so the
              promise is still the first thing read. A wrapped heading's box
              stays as wide as the room it was given, which left Kanko far
              from the words, so the box is capped at its widest line, "Know
              whether" (about 6.7em at this face and tracking), and Kanko is
              small enough on a phone for that line to fit: two lines, not
              three. The headline is the page's largest paint; Kanko loads
              eagerly so it lands with it. */}
          <div className="flex items-end gap-3 sm:gap-4">
            <h1 className="min-w-0 max-w-[6.8em] text-display">
              Know whether it&rsquo;s healing.
            </h1>
            <Kanko
              mood="hello"
              size={144}
              priority
              className="size-16 shrink-0 min-[400px]:size-24 sm:size-36"
            />
          </div>
          {/* The promise stops at what Insights shows today: a pattern in
              what came before a sore. It does not yet say whether a
              treatment helped, so the page does not either. */}
          <p className="prose-measure mt-6 text-lg text-muted-foreground">
            Canker sores all feel like they last forever. Mark where one is,
            check in for a minute a day, and see whether it is shrinking and
            what tends to come before the next one.
          </p>
          {/* Full-width on a phone, under the thumb. The app sits right
              under it, in the first screen, rather than only in the footer. */}
          <StartButton className="mt-8 w-full sm:h-11 sm:w-auto sm:px-8" />
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <StoreBadges className="-ml-2" />
            {!APP_STORE_URL && (
              <p className="text-sm text-muted-foreground">
                iPhone app coming soon
              </p>
            )}
          </div>
        </div>

        <TodayPhone />
      </section>

      <section className="fold-first container py-8 sm:py-12">
        {/* The map sits beside the scale it is coloured by, so the ramp is
            read once in the abstract and once on a mouth. */}
        <div className="grid items-center gap-8 rounded-worksheet border border-border bg-card p-5 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="min-w-0">
            <h2 className="text-section">One scale, used everywhere</h2>
            <p className="prose-measure mt-2 text-muted-foreground">
              Pain is the only thing in Canker Core that gets a colour. The
              same ramp appears on the map, in the history chart, and in every
              table, so a glance tells you how bad a day was.
            </p>
            <div className="mt-6">
              <SeverityScale />
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <MouthMapHero />
          </div>
        </div>
      </section>

      <section className="fold-shell container py-8 sm:py-12 lg:py-16">
        <h2 className="text-title fold:max-w-[var(--fold-col)]">
          A sore, from first twinge to gone
        </h2>
        <ol className="fold-split mt-10 grid gap-8 sm:grid-cols-3">
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
