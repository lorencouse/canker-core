import type { Metadata } from 'next';
import Link from 'next/link';

import Kanko from '@/components/kanko/Kanko';
import Prose from '@/components/marketing/Prose';
import SeverityScale from '@/components/marketing/SeverityScale';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About',
  description:
    'What Canker Core records, how the daily check-in and the pain scale work, and what it deliberately does not do.',
  alternates: { canonical: '/about' }
};

export default function AboutPage() {
  return (
    <>
      <Prose
        title="How Canker Core works"
        intro="Canker Core is a log, not a diagnosis. It records what you tell it about your sores and your days, so you can see whether a sore is getting better and what tends to come before the next one."
        mascot={
          <Kanko
            mood="neutral"
            size={128}
            priority
            className="size-24 shrink-0 sm:size-32"
          />
        }
      >
        <section>
          <h2>Marking a sore</h2>
          <p>
            The mouth map has three views: the front of the open mouth, the
            cheeks and the lips. Tap the spot where the sore is and it becomes a
            point on the map, stored as a position rather than a description you
            have to write out. You can drag it if you put it in the wrong place.
          </p>
        </section>

        <section>
          <h2>A one-minute check-in, once a day</h2>
          <p>
            Each day the check-in starts with every open sore: its width in
            millimetres and its pain from 1 to 10, or the same as yesterday.
            Each reading is added rather than written over the last one, so the
            whole course of a sore is kept, and that series is what the history
            chart draws.
          </p>
          <p>
            Then it asks about the day: anything new in your mouth, how you
            slept, what you ate, how you felt and what you tried. Each is a tap
            or two from a short list.
          </p>
        </section>

        <section>
          <h2>Streaks and patterns</h2>
          <p>
            A day you check in with nothing on the trigger lists adds one to
            your streak. Poor sleep, and a stress level of 4 or 5, count as
            triggers too.
          </p>
          <p>
            Insights lines up what came before each sore, such as coffee before
            two of your last three. That is a pattern, not proof, and it is
            worded that way in the app.
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
            anything. A mouth ulcer that has not started shrinking after two
            weeks, keeps coming back, or comes with fever or weight loss is
            worth taking to a doctor or dentist. This is a record to bring with
            you, not a substitute for that visit.
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

      <div className="fold-first container max-w-2xl pb-16">
        <Button asChild size="lg">
          <Link href="/signin/signup">Start tracking</Link>
        </Button>
      </div>
    </>
  );
}
