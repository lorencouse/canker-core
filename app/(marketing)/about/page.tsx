import type { Metadata } from 'next';
import Link from 'next/link';

import Prose from '@/components/marketing/Prose';
import SeverityScale from '@/components/marketing/SeverityScale';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About',
  description:
    'What Canker Core records, how the pain scale works, and what it deliberately does not do.'
};

export default function AboutPage() {
  return (
    <>
      <Prose
        title="How it works"
        intro="Canker Core is a log, not a diagnosis. It records what you tell it about a sore so you can tell whether it is getting better."
      >
        <section>
          <h2>Marking a sore</h2>
          <p>
            The mouth map has two views, the open mouth and the gums. Tap the
            spot where the sore is and it becomes a point on the map, stored as
            a position rather than a description you have to write out. You can
            drag it if you put it in the wrong place.
          </p>
        </section>

        <section>
          <h2>Two readings, taken daily</h2>
          <p>
            Each sore carries a width in millimetres and a pain level from 1 to
            10. Every time you update it, the new pair is appended rather than
            overwriting the last one, so the whole course of a sore is kept.
            That series is what the history chart draws.
          </p>
        </section>

        <section>
          <h2>The pain scale</h2>
          <p>
            Pain is the only thing in Canker Core that gets a colour, and the
            same ramp is used on the map, in the chart, and in the tables.
          </p>
          <div className="mt-5">
            <SeverityScale />
          </div>
        </section>

        <section>
          <h2>What it will not tell you</h2>
          <p>
            Canker Core has no opinion about treatments and does not diagnose
            anything. Mouth ulcers that last longer than three weeks, keep
            coming back, or come with fever or weight loss are worth taking to a
            doctor or dentist. This is a record to bring with you, not a
            substitute for that visit.
          </p>
        </section>

        <section>
          <h2>Your data</h2>
          <p>
            Sores are tied to your account and are not shared with anyone. See{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              the privacy page
            </Link>{' '}
            for what is stored and how to remove it.
          </p>
        </section>
      </Prose>

      <div className="container max-w-2xl pb-16">
        <Button asChild size="lg">
          <Link href="/signin/signup">Start tracking</Link>
        </Button>
      </div>
    </>
  );
}
