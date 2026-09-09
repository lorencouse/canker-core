import type { Metadata } from 'next';
import { CalendarDays, History, Lightbulb, Map, type LucideIcon } from 'lucide-react';

import { appUrl } from '@/lib/site';
import { Section } from '@/components/section';
import { CtaButton } from '@/components/cta-button';
import { TodayScreenMock } from '@/components/today-screen-mock';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'A walk-through of the four tabs in Canker Core: Today, Mouth, Insights and History. One check-in a day, a map that is also a timeline, and patterns reported with sample sizes.',
  alternates: { canonical: '/how-it-works' }
};

interface Tab {
  icon: LucideIcon;
  name: string;
  tagline: string;
  paragraphs: string[];
}

const tabs: Tab[] = [
  {
    icon: CalendarDays,
    name: 'Today',
    tagline: 'The check-in. Under a minute, once a day.',
    paragraphs: [
      'Today shows every sore that is currently open, each on its own card with yesterday’s values already filled in. For each one you set the size in millimetres and the pain from 0 to 10, or tap "Same as yesterday" if nothing has changed. When a sore is gone, tap "Healed" and the app records its final day. A new sore takes three taps: where it is on the mouth map, roughly how big, and how much it hurts.',
      'Below the sore cards is a single list of factors for the day. These are the things you suspect might matter: coffee, citrus, chocolate, a medication, a benzocaine gel or salt-water rinse, a cold, a bitten cheek, SLS toothpaste, where you are in your cycle. Tap what applied. You can add your own factors and hide the ones that never apply to you, so the list stays short.'
    ]
  },
  {
    icon: Map,
    name: 'Mouth',
    tagline: 'A map of where sores are and have been.',
    paragraphs: [
      'The Mouth tab is a simple diagram of the inside of the mouth: lips, cheeks, gums, tongue, floor and roof. Each active sore sits where you placed it, sized by its last measurement and coloured by its pain rating on a five-step ramp. Tap any sore to open its card, or tap an empty spot to start a new one.',
      'The same map doubles as a timeline. Drag the scrubber underneath to move back through the months and watch sores appear, grow, shrink and disappear. Sites that recur show up quickly, and so does the pattern of a flare-up that moves from one side of the mouth to the other. Nothing here is interpreted for you; it is just your records, drawn.'
    ]
  },
  {
    icon: Lightbulb,
    name: 'Insights',
    tagline: 'Patterns stated with sample sizes, never as cause.',
    paragraphs: [
      'Insights starts with the basics: average duration of a healed sore, the typical gap between flare-ups, how many sores you tend to have at once, and how each of those has changed over time. These are available on the free tier as soon as you have a few sores logged.',
      'The trigger and treatment reports are the reason most people keep logging. For each factor, the app compares how often it appeared in the days before a new sore against how often it appeared on all your days. The result is shown as a lift, such as "poor sleep, ×2.4, on 7 of 9 pre-sore days", with the sample size beside it. Treatments work the other way round: sores where a treatment was logged on most days are compared with sores where it was not, and the difference in time to heal is shown. Small samples are flagged as tentative, and every figure is worded as a correlation in your own data, not a cause. Any sore open longer than 14 days is marked with a nudge to see a dentist or doctor.'
    ]
  },
  {
    icon: History,
    name: 'History',
    tagline: 'Every sore, every day, in one list.',
    paragraphs: [
      'History is the plain list: every sore you have logged, newest first, with its location, start and end dates, peak size and pain, and the factors and treatments recorded during its life. Tap one to see the day-by-day curve of size and pain as a small chart.',
      'This is the tab to open in a dentist’s chair. On the free tier it covers the last 90 days. Pro extends it to your full history and adds a clinician PDF export, which lays out the same list, the map and the basic stats on a couple of pages you can hand over or attach to a message.'
    ]
  }
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-border border-b">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 md:grid-cols-[1.2fr_0.8fr] md:py-20">
          <div className="flex flex-col gap-5">
            <p className="text-accent font-mono text-xs font-medium uppercase tracking-[0.12em]">
              How it works
            </p>
            <h1 className="text-foreground text-4xl font-bold leading-[1.05] sm:text-5xl">
              Four tabs. One habit.
            </h1>
            <p className="measure text-secondary-foreground text-lg leading-relaxed">
              Canker Core is deliberately small. You log once a day, and the other three
              tabs are different views of what you logged. Here is what each one does and
              why it is there.
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <TodayScreenMock />
          </div>
        </div>
      </section>

      <Section>
        <div className="flex flex-col gap-14">
          {tabs.map((tab, index) => (
            <article
              key={tab.name}
              id={tab.name.toLowerCase()}
              className="grid scroll-mt-24 gap-6 md:grid-cols-[14rem_1fr] md:gap-12"
            >
              <div className="flex flex-col gap-3">
                <span className="bg-accent-soft text-accent inline-flex size-11 items-center justify-center rounded-lg">
                  <tab.icon className="size-5" aria-hidden="true" />
                </span>
                <p className="text-muted-foreground font-mono text-xs">
                  Tab {index + 1} of 4
                </p>
                <h2 className="text-foreground text-2xl font-semibold">{tab.name}</h2>
                <p className="text-secondary-foreground text-sm leading-relaxed">
                  {tab.tagline}
                </p>
              </div>
              <div className="measure text-secondary-foreground flex flex-col gap-5 text-[1.0625rem] leading-[1.7]">
                {tab.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        tone="muted"
        heading="Try the check-in"
        description="It is free, it takes under a minute, and you can delete everything whenever you like."
      >
        <div className="flex flex-wrap gap-3">
          <CtaButton href={appUrl} size="lg">
            Open the app
          </CtaButton>
          <CtaButton href="/pricing" variant="secondary" size="lg">
            See pricing
          </CtaButton>
        </div>
      </Section>
    </>
  );
}
