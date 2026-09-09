import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  BellRing,
  ClipboardList,
  Eye,
  Lightbulb,
  Smartphone,
  Trash2,
  ShieldCheck,
  WifiOff,
  type LucideIcon
} from 'lucide-react';

import { appUrl, siteDescription } from '@/lib/site';
import { getAllGuides } from '@/lib/guides';
import { CtaButton } from '@/components/cta-button';
import { Section } from '@/components/section';
import { StatTile } from '@/components/stat-tile';
import { GuideCard } from '@/components/guide-card';
import { TodayScreenMock } from '@/components/today-screen-mock';

export const metadata: Metadata = {
  description: siteDescription,
  alternates: { canonical: '/' }
};

interface Step {
  icon: LucideIcon;
  step: string;
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    icon: ClipboardList,
    step: '01',
    title: 'Log',
    body: 'One check-in a day, under 60 seconds. For each active sore, set its size in millimetres and pain from 0 to 10, then tap the factors that applied: foods, treatments, sleep, illness, a bitten cheek.'
  },
  {
    icon: Eye,
    step: '02',
    title: 'See',
    body: 'A mouth map that is also a timeline. Every sore you have ever logged sits where it was, coloured by pain, so you can scrub back through months and see where and when they cluster.'
  },
  {
    icon: Lightbulb,
    step: '03',
    title: 'Learn',
    body: 'Patterns stated honestly. Insights compares the days before a new sore against your own baseline and reports the lift with its sample size, worded as correlation, never as cause.'
  }
];

interface Commitment {
  icon: LucideIcon;
  title: string;
  body: string;
}

const promises: Commitment[] = [
  {
    icon: Smartphone,
    title: 'Mobile-first',
    body: 'Large targets, one screen, one thumb. Works in the browser today and ships as an iOS and Android app.'
  },
  {
    icon: BellRing,
    title: 'A reminder that fits your routine',
    body: 'One nudge a day at the time you brush your teeth. Pro adds more, but one is enough for most people.'
  },
  {
    icon: WifiOff,
    title: 'Offline check-ins',
    body: 'Log without a connection. Entries sync when you are back online, and nothing is lost in between.'
  },
  {
    icon: ShieldCheck,
    title: 'Private by default',
    body: 'Your records are yours. We do not sell health data, and nothing is shared unless you export it.'
  },
  {
    icon: Trash2,
    title: 'Delete your data any time',
    body: 'Export everything as a file, or remove your account and its records in one step. No emails asking why.'
  }
];

export default function HomePage() {
  const guides = getAllGuides().slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="border-border border-b">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 md:grid-cols-[1.15fr_0.85fr] md:py-20">
          <div className="flex flex-col gap-6">
            <p className="text-accent font-mono text-xs font-medium uppercase tracking-[0.12em]">
              Daily check-in for recurring canker sores
            </p>
            <h1 className="text-foreground text-4xl font-bold leading-[1.05] sm:text-5xl md:text-[3.5rem]">
              Find out what&rsquo;s behind your canker sores.
            </h1>
            <p className="measure text-secondary-foreground text-lg leading-relaxed">
              Log each sore in under a minute a day. Canker Core keeps the map, the
              timeline and the numbers, then tells you which factors show up before a
              flare-up more often than your own normal.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <CtaButton href={appUrl} size="lg">
                Open the app
              </CtaButton>
              <CtaButton href="/how-it-works" variant="secondary" size="lg">
                How it works
              </CtaButton>
            </div>
            <p className="text-muted-foreground text-sm">
              Free to use. No card needed. Not a diagnostic tool.
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <TodayScreenMock />
          </div>
        </div>
      </section>

      {/* How it works */}
      <Section
        id="how-it-works"
        eyebrow="How it works"
        heading="Three habits, one small app"
        description="Canker Core is built around a daily check-in. Everything else, the map, the timeline, the insights, is a view of what you logged."
      >
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.step}
              className="border-border bg-card shadow-foreground/5 flex flex-col gap-4 rounded-xl border p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="bg-accent-soft text-accent inline-flex size-10 items-center justify-center rounded-lg">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  {step.step}
                </span>
              </div>
              <h3 className="text-foreground text-xl font-semibold">{step.title}</h3>
              <p className="text-secondary-foreground text-[0.95rem] leading-relaxed">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Link
            href="/how-it-works"
            className="text-accent inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            Walk through the four tabs
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </Section>

      {/* What you'll learn */}
      <Section
        id="insights"
        tone="muted"
        eyebrow="What you'll learn"
        heading="Numbers about your mouth, not the average mouth"
        description="After a few weeks of check-ins, Insights answers the questions you actually have. The figures below are examples of what a report looks like, not anyone's real data."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            example
            tone="accent"
            label="Average duration"
            value="9.4"
            unit="days"
            note="Across 11 healed sores in the last 6 months."
          />
          <StatTile
            example
            tone="neutral"
            label="Gap between flare-ups"
            value="31"
            unit="days"
            note="Median time from one sore healing to the next appearing."
          />
          <StatTile
            example
            tone="warn"
            label="Poor sleep before a new sore"
            value="×2.4"
            note="Logged on 7 of 9 pre-sore days vs 33% of all days. Correlation, not cause."
          />
          <StatTile
            example
            tone="heal"
            label="Days to heal with benzocaine"
            value="8.1"
            unit="vs 10.6"
            note="Sores treated on most days vs untreated. n = 6 and 5."
          />
        </div>
        <p className="text-muted-foreground mt-6 max-w-3xl text-sm leading-relaxed">
          Every lift is shown with how many days it rests on. Small samples are flagged,
          and Canker Core never says a factor caused a sore. Sores open longer than 14
          days are marked with a nudge to see a dentist or doctor.
        </p>
      </Section>

      {/* Built for the bathroom mirror */}
      <Section
        id="built-for"
        eyebrow="Built for the bathroom mirror"
        heading="Designed for the thirty seconds you have"
        description="Most check-ins happen while brushing your teeth, so the app is shaped for that: fast, thumb-friendly, and quiet about your data."
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promises.map((item) => (
            <li
              key={item.title}
              className="border-border bg-card flex gap-4 rounded-xl border p-5"
            >
              <span className="bg-heal-soft text-heal inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
                <item.icon className="size-4.5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-foreground font-sans text-base font-semibold tracking-normal">
                  {item.title}
                </h3>
                <p className="text-secondary-foreground text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Guides teaser */}
      <Section
        id="guides"
        tone="muted"
        eyebrow="Guides"
        heading="Plain-English answers to the usual questions"
        description="Short, sourced-in-spirit explainers on how long sores last, what tends to set them off, and when to stop waiting and see someone."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {guides.map((guide) => (
            <GuideCard key={guide.slug} {...guide} />
          ))}
        </div>
        <div className="mt-8">
          <Link
            href="/guides"
            className="text-accent inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            All guides
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </Section>

      {/* Pricing summary */}
      <Section
        id="pricing"
        eyebrow="Pricing"
        heading="Free for the habit. Pro for the history."
        description="Logging is free and stays free. Pro will unlock the long-term view once it ships."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border-border bg-card flex flex-col gap-5 rounded-xl border p-6">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Free</p>
              <p className="text-foreground mt-1 text-3xl font-semibold">$0</p>
            </div>
            <ul className="text-secondary-foreground flex flex-col gap-2 text-[0.95rem]">
              <li>Unlimited daily logging</li>
              <li>Mouth map and timeline</li>
              <li>90 days of history</li>
              <li>Basic stats: duration, gap, active count</li>
              <li>14-day nudge to see a professional</li>
            </ul>
            <CtaButton href={appUrl} className="mt-auto self-start">
              Open the app
            </CtaButton>
          </div>
          <div className="border-accent/30 bg-card flex flex-col gap-5 rounded-xl border p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Pro</p>
                <p className="text-foreground mt-1 text-3xl font-semibold">Coming soon</p>
              </div>
              <span className="bg-accent-soft text-accent rounded-full px-2.5 py-1 text-xs font-medium">
                In development
              </span>
            </div>
            <ul className="text-secondary-foreground flex flex-col gap-2 text-[0.95rem]">
              <li>Everything in Free</li>
              <li>Full history, as far back as you have logged</li>
              <li>Trigger and treatment insights with sample sizes</li>
              <li>Photo logging per sore</li>
              <li>Clinician PDF export</li>
              <li>Multiple reminders</li>
            </ul>
            <CtaButton href="/pricing" variant="secondary" className="mt-auto self-start">
              Compare plans
            </CtaButton>
          </div>
        </div>
      </Section>
    </>
  );
}
