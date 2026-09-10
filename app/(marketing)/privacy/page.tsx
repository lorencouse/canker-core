import type { Metadata } from 'next';

import Prose from '@/components/marketing/Prose';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What Canker Core stores about you, and how to get rid of it.'
};

export default function PrivacyPage() {
  return (
    <Prose
      title="Privacy"
      intro="Canker Core holds health information, so it keeps as little as it can."
      updated="9 September 2026"
    >
      <section>
        <h2>What is stored</h2>
        <p>
          Your email address and password hash, so you can sign in. Anything you
          choose to put in your profile, such as a name or username. And your
          sores: position on the mouth map, size and pain readings, and the
          dates those readings were taken.
        </p>
      </section>

      <section>
        <h2>Where it is stored</h2>
        <p>
          On a self-hosted Postgres database on the same server that runs the
          site. Your sores are readable only by your own account.
        </p>
      </section>

      <section>
        <h2>What is not done with it</h2>
        <p>
          Your records are not sold, shared with advertisers, or used to train
          anything. There is no third-party analytics or tracking on the pages
          where your data appears.
        </p>
      </section>

      <section>
        <h2>Sign-in with Google or GitHub</h2>
        <p>
          If you sign in that way, Canker Core receives your email address and
          account identifier from that provider and nothing else. It never sees
          your password for those accounts.
        </p>
      </section>

      <section>
        <h2>Removing your data</h2>
        <p>
          You can delete individual sores from the mouth map at any time. To
          delete your whole account and every reading attached to it, email the
          address below and it will be removed.
        </p>
      </section>

      <section>
        <h2>Getting in touch</h2>
        <p>
          Questions about any of this go to{' '}
          <a
            href="mailto:hello@cankercore.com"
            className="text-primary hover:underline"
          >
            hello@cankercore.com
          </a>
          .
        </p>
      </section>
    </Prose>
  );
}
