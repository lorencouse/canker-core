import type { Metadata } from 'next';

import Prose from '@/components/marketing/Prose';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What Canker Core stores about you, and how to get rid of it.',
  alternates: { canonical: '/privacy' }
};

export default function PrivacyPage() {
  return (
    <Prose
      title="Privacy"
      intro="Canker Core holds health information, so it keeps as little as it can."
      updated="12 October 2026"
    >
      <section>
        <h2>What is stored</h2>
        <p>
          Your email address and password hash, so you can sign in. Anything you
          choose to put in your profile, which is only a name. And your
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
        <h2>How the site measures itself</h2>
        <p>
          There is no third-party analytics anywhere on the site. When you first
          visit, a single first-party cookie notes the page you landed on and
          the name of the site that linked you there, if any. If you go on to
          create an account, those two facts are saved with it, which is how
          Canker Core tells which articles help people start tracking. The only
          other measure is a count of how many accounts go on to log a reading,
          worked out from the readings themselves.
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
          delete your whole account and every reading attached to it, open
          Settings, then Account, and choose Delete account. It is removed
          immediately. The same page lets you download everything first as a
          CSV file.
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
