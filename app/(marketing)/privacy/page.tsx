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
      updated="6 November 2026"
    >
      <section>
        <h2>What is stored</h2>
        <p>
          Your email address and password hash, so you can sign in. Anything you
          choose to put in your profile, which is only a name. And your sores:
          position on the mouth map, size and pain readings, and the dates those
          readings were taken. Your daily logs, too: the triggers and treatments
          you tick, any note, your sleep hours and quality, your stress, and
          whether you finished or skipped each day&rsquo;s check-in.
        </p>
      </section>

      <section>
        <h2>Where it is stored</h2>
        <p>
          On a self-hosted Postgres database on the same server that runs the
          site. Your sores are readable only by your own account.
        </p>
        <p>
          Photos of a sore, which you can take in the iPhone and Android apps,
          are the exception: they are saved only on your phone, inside the app,
          and are never uploaded. They are not on the server, so they are not in
          the CSV download, and deleting a sore or your account in the app
          deletes them from that phone.
        </p>
      </section>

      <section>
        <h2>Sleep from Apple Health or Health Connect</h2>
        <p>
          In the iPhone and Android apps, the check-in can fill in your hours of
          sleep from Apple Health or Health Connect. Your sleep is read only
          when you tap Import from Health, and nothing else in Health is read.
          Canker Core adds up the time you were asleep last night and saves only
          that total and where it came from, alongside your other sleep answers.
          It never writes to Health, and Health data is never shared, sold, or
          used for advertising. You can turn off access at any time in the
          Health app or Health Connect settings.
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
          worked out from the readings themselves. A second cookie, named tz,
          stores only your device’s time zone so dates show correctly; it is not
          used for tracking. In the iPhone and Android apps, a third, named
          native-app, only tells the site it is open in the app, so the app
          starts on Today; it holds nothing about you.
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
          immediately. The same page lets you download everything first as a CSV
          file.
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
