import type { Metadata } from 'next';

import { Section } from '@/components/section';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'How Canker Core handles your data: it is yours, you can export or delete it at any time, and we never sell health data.',
  alternates: { canonical: '/privacy' },
  robots: { index: false, follow: true }
};

export default function PrivacyPage() {
  return (
    <Section as="h1" eyebrow="Privacy" heading="Privacy policy">
      <div className="measure text-secondary-foreground flex flex-col gap-5 text-[1.0625rem] leading-[1.7]">
        <p className="border-warn/40 bg-warn/10 text-foreground rounded-lg border px-4 py-3 text-sm">
          <strong className="font-semibold">Draft.</strong> This is a working summary of
          our commitments, not yet a reviewed legal document. The full policy will replace
          this page before Pro launches. The commitments below will not get weaker.
        </p>

        <h2 className="text-foreground mt-4 text-xl font-semibold">What we collect</h2>
        <p>
          The records you enter: sores, their location, size and pain over time, the
          factors and treatments you tap, and any notes. Your email address, used to sign
          in. Basic technical logs needed to keep the service running, such as error
          reports and request timestamps.
        </p>

        <h2 className="text-foreground mt-4 text-xl font-semibold">What we do not do</h2>
        <ul className="marker:text-accent list-disc space-y-2 pl-6">
          <li>We do not sell health data, or any other data, to anyone.</li>
          <li>We do not share your records with advertisers, insurers or employers.</li>
          <li>
            We do not use your records to train models or build products that are not
            yours.
          </li>
          <li>
            We do not run third-party advertising or tracking pixels on the app or this
            site.
          </li>
        </ul>

        <h2 className="text-foreground mt-4 text-xl font-semibold">Your data is yours</h2>
        <p>
          You can export everything you have logged as a file at any time from the app, on
          any tier. You can delete individual entries, or delete your account and all of
          its data in one step. Deletion is carried out promptly and is permanent; backups
          are rotated out on a fixed schedule.
        </p>

        <h2 className="text-foreground mt-4 text-xl font-semibold">Where data lives</h2>
        <p>
          Records are stored with a managed database provider, encrypted in transit and at
          rest. Access on our side is limited to what is needed to run the service and fix
          problems, and is logged. Offline check-ins are held on your device until they
          sync.
        </p>

        <h2 className="text-foreground mt-4 text-xl font-semibold">
          Insights are computed from your data only
        </h2>
        <p>
          Every statistic in the app is calculated from your own records. We do not pool
          users&rsquo; health data to produce population figures without asking first, and
          we have no plans to.
        </p>

        <h2 className="text-foreground mt-4 text-xl font-semibold">Contact</h2>
        <p>
          Questions about this policy can be sent to privacy@cankercore.com. If we change
          the policy in a way that affects you, we will tell you in the app before it
          takes effect.
        </p>
      </div>
    </Section>
  );
}
