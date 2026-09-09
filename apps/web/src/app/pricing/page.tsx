import type { Metadata } from 'next';
import { Check, Minus } from 'lucide-react';

import { appUrl } from '@/lib/site';
import { Section } from '@/components/section';
import { CtaButton } from '@/components/cta-button';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Canker Core is free for daily logging, the mouth map and 90 days of history. Pro, coming soon, adds full history, trigger and treatment insights, photos, PDF export and multiple reminders.',
  alternates: { canonical: '/pricing' }
};

type Availability = boolean | string;

interface FeatureRow {
  feature: string;
  free: Availability;
  pro: Availability;
}

const rows: FeatureRow[] = [
  { feature: 'Daily check-ins', free: 'Unlimited', pro: 'Unlimited' },
  { feature: 'Active sores tracked at once', free: 'Unlimited', pro: 'Unlimited' },
  { feature: 'Mouth map with timeline scrubber', free: true, pro: true },
  { feature: 'History', free: '90 days', pro: 'Everything you have logged' },
  { feature: 'Basic stats (duration, gap, active count)', free: true, pro: true },
  { feature: '14-day nudge to see a professional', free: true, pro: true },
  { feature: 'Trigger insights with lift and sample size', free: false, pro: true },
  { feature: 'Treatment insights (time to heal)', free: false, pro: true },
  { feature: 'Photo logging per sore', free: false, pro: true },
  { feature: 'Clinician PDF export', free: false, pro: true },
  { feature: 'Daily reminders', free: 'One', pro: 'Multiple' },
  { feature: 'Export your data as a file', free: true, pro: true },
  { feature: 'Delete your account and data', free: true, pro: true }
];

function Cell({ value }: { value: Availability }) {
  if (typeof value === 'string') {
    return <span className="text-foreground">{value}</span>;
  }
  return value ? (
    <span className="text-heal inline-flex items-center gap-1.5">
      <Check className="size-4" aria-hidden="true" />
      <span className="sr-only">Included</span>
    </span>
  ) : (
    <span className="text-muted-foreground inline-flex items-center">
      <Minus className="size-4" aria-hidden="true" />
      <span className="sr-only">Not included</span>
    </span>
  );
}

export default function PricingPage() {
  return (
    <>
      <Section
        as="h1"
        eyebrow="Pricing"
        heading="Free for the habit. Pro for the history."
        description="Logging, the map and the basics are free and will stay free. Pro is in development and has no price yet; when it launches, everything you have logged on the free tier will carry over."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border-border bg-card flex flex-col gap-5 rounded-xl border p-6">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Free</p>
              <p className="text-foreground mt-1 text-3xl font-semibold">$0</p>
              <p className="text-secondary-foreground mt-1 text-sm">
                No card, no trial clock.
              </p>
            </div>
            <CtaButton href={appUrl} className="self-start">
              Open the app
            </CtaButton>
          </div>
          <div className="border-accent/30 bg-card flex flex-col gap-5 rounded-xl border p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Pro</p>
                <p className="text-foreground mt-1 text-3xl font-semibold">Coming soon</p>
                <p className="text-secondary-foreground mt-1 text-sm">
                  Pricing will be announced before launch.
                </p>
              </div>
              <span className="bg-accent-soft text-accent rounded-full px-2.5 py-1 text-xs font-medium">
                In development
              </span>
            </div>
            <CtaButton href={appUrl} variant="secondary" className="self-start">
              Start logging on Free
            </CtaButton>
          </div>
        </div>

        <div className="border-border mt-10 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[36rem] border-collapse text-left text-[0.95rem]">
            <caption className="sr-only">
              Feature comparison between the Free and Pro plans
            </caption>
            <thead className="bg-muted text-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Feature
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Free
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Pro{' '}
                  <span className="text-muted-foreground font-normal">(coming soon)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature} className="border-border bg-card border-t">
                  <th
                    scope="row"
                    className="text-secondary-foreground px-5 py-3 font-medium"
                  >
                    {row.feature}
                  </th>
                  <td className="px-5 py-3">
                    <Cell value={row.free} />
                  </td>
                  <td className="px-5 py-3">
                    <Cell value={row.pro} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section tone="muted" heading="Questions people ask">
        <dl className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <dt className="text-foreground font-semibold">
              What happens to my data after 90 days on Free?
            </dt>
            <dd className="text-secondary-foreground text-[0.95rem] leading-relaxed">
              Nothing is deleted. Older entries are kept and still count towards your
              stats; the app simply stops showing them in the map, timeline and History
              list until you upgrade. You can export the full set at any time.
            </dd>
          </div>
          <div className="flex flex-col gap-2">
            <dt className="text-foreground font-semibold">Will Pro be a subscription?</dt>
            <dd className="text-secondary-foreground text-[0.95rem] leading-relaxed">
              Probably a low monthly or yearly fee. We have not settled the price, and we
              would rather say so than guess here.
            </dd>
          </div>
          <div className="flex flex-col gap-2">
            <dt className="text-foreground font-semibold">Is this medical advice?</dt>
            <dd className="text-secondary-foreground text-[0.95rem] leading-relaxed">
              No. Canker Core is a record-keeping tool. It does not diagnose or treat
              anything, and it reports correlations in your own data, not causes. Take
              your records to a dentist or doctor if a sore lasts longer than two weeks.
            </dd>
          </div>
          <div className="flex flex-col gap-2">
            <dt className="text-foreground font-semibold">Can I use it on my phone?</dt>
            <dd className="text-secondary-foreground text-[0.95rem] leading-relaxed">
              Yes. The web app works in any modern mobile browser and can be added to your
              home screen. Native iOS and Android apps are on the way.
            </dd>
          </div>
        </dl>
      </Section>
    </>
  );
}
