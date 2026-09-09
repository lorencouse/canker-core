import Link from 'next/link';

import MouthMapHero from '@/components/marketing/MouthMapHero';
import SeverityScale from '@/components/marketing/SeverityScale';
import { Button } from '@/components/ui/button';
import { getUser } from '@/lib/queries';

/**
 * Healing is genuinely a sequence, so a timeline is the honest structure here
 * rather than decorative step numbers.
 */
const TIMELINE = [
  {
    when: 'Day 0',
    title: 'Mark it',
    body: 'Tap the spot on the mouth map. Set how wide it is and how much it hurts.'
  },
  {
    when: 'Day 2',
    title: 'Update it',
    body: 'Come back and move the two sliders. Every reading is kept, not overwritten.'
  },
  {
    when: 'Day 7',
    title: 'See it close',
    body: 'The history chart shows the size falling. If it is not falling, you will see that too.'
  }
];

export default async function HomePage() {
  const user = await getUser();
  const startHref = user ? '/my-sores' : '/signin/signup';

  return (
    <>
      <section className="container grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div>
          <h1 className="text-display">Know whether it&rsquo;s healing.</h1>
          <p className="prose-measure mt-6 text-lg text-muted-foreground">
            Canker sores all feel like they last forever. Mark where one is, log
            its size and pain each day, and find out whether it is actually
            shrinking &mdash; and whether anything you tried made a difference.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href={startHref}>
                {user ? 'Open your map' : 'Start tracking'}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/about">How it works</Link>
            </Button>
          </div>
        </div>

        <MouthMapHero />
      </section>

      <section className="container py-12">
        <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
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

      <section className="container py-12 lg:py-16">
        <h2 className="text-title">A sore, from first twinge to gone</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {TIMELINE.map((step) => (
            <li
              key={step.when}
              className="relative border-t border-border pt-5"
            >
              <span className="tabular text-sm font-semibold text-primary">
                {step.when}
              </span>
              <h3 className="mt-1 text-subhead">{step.title}</h3>
              <p className="mt-2 text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container pb-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-lg border border-border bg-card p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-section">Start with the one you have now</h2>
            <p className="prose-measure mt-2 text-muted-foreground">
              It takes about fifteen seconds to log the first reading.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href={startHref}>
              {user ? 'Open your map' : 'Start tracking'}
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
