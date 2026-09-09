import type { Metadata } from 'next';

import { disclaimer } from '@/lib/site';
import { Section } from '@/components/section';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The terms of using Canker Core, in plain English. Draft.',
  alternates: { canonical: '/terms' },
  robots: { index: false, follow: true }
};

export default function TermsPage() {
  return (
    <Section as="h1" eyebrow="Terms" heading="Terms of use">
      <div className="measure text-secondary-foreground flex flex-col gap-5 text-[1.0625rem] leading-[1.7]">
        <p className="border-warn/40 bg-warn/10 text-foreground rounded-lg border px-4 py-3 text-sm">
          <strong className="font-semibold">Draft.</strong> These are the terms in plain
          English while the full version is being written. They describe how we intend to
          operate; the reviewed document will say the same things in more careful
          language.
        </p>

        <h2 className="text-foreground mt-4 text-xl font-semibold">
          What Canker Core is
        </h2>
        <p>
          Canker Core is a record-keeping tool for tracking mouth sores. It stores what
          you enter and shows it back to you as maps, timelines and statistics.{' '}
          {disclaimer}
        </p>

        <h2 className="text-foreground mt-4 text-xl font-semibold">Not medical advice</h2>
        <p>
          Nothing in the app or on this site is a diagnosis, a treatment recommendation or
          a substitute for seeing a qualified professional. Insights describe correlations
          in your own records and can be wrong, especially with small samples. Decisions
          about your health should be made with a dentist or doctor.
        </p>

        <h2 className="text-foreground mt-4 text-xl font-semibold">Your account</h2>
        <p>
          You need to be at least 16 to create an account. You are responsible for keeping
          your sign-in method secure. You can close your account at any time, which
          deletes your data as described in the privacy policy.
        </p>

        <h2 className="text-foreground mt-4 text-xl font-semibold">Your content</h2>
        <p>
          Everything you log belongs to you. You give us only the permission needed to
          store it, show it back to you, and compute your statistics. We do not claim any
          other rights over it.
        </p>

        <h2 className="text-foreground mt-4 text-xl font-semibold">
          The free tier and Pro
        </h2>
        <p>
          The free tier is provided as is, with no guarantee of uptime, though we work to
          keep it reliable. Pro, when it launches, will have its own terms for billing,
          refunds and cancellation, and you will see them before you pay anything.
        </p>

        <h2 className="text-foreground mt-4 text-xl font-semibold">
          Changes and contact
        </h2>
        <p>
          If these terms change in a way that matters, we will tell you in the app before
          the change takes effect. Questions can be sent to hello@cankercore.com.
        </p>
      </div>
    </Section>
  );
}
