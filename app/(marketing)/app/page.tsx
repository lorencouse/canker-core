import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, Camera, LogIn, Moon, type LucideIcon } from 'lucide-react';

import Kanko from '@/components/kanko/Kanko';
import StoreBadges from '@/components/marketing/StoreBadges';
import { APP_STORE_URL } from '@/utils/app-stores';

const TITLE = 'Get the app';
const DESCRIPTION =
  'Canker Core for Android, free on Google Play: map your mouth sores, log size and pain each day, and see whether they are healing. iPhone is on its way.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/app' },
  openGraph: {
    type: 'website',
    url: '/app',
    title: 'Canker Core for Android',
    description: DESCRIPTION
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Canker Core for Android',
    description: DESCRIPTION
  }
};

/**
 * What the installed app does that a browser tab cannot. Every line is a
 * feature the app ships (docs/store/google-play.md), worded as a fact rather
 * than a promise.
 */
const NATIVE: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Bell,
    title: 'A daily reminder',
    body: 'One nudge a day, at a time you pick, to do the one-minute check-in.'
  },
  {
    icon: Moon,
    title: 'Sleep in one tap',
    body: 'Fill in last night’s sleep from Health Connect. Read only, and only when you tap.'
  },
  {
    icon: Camera,
    title: 'Photos that stay put',
    body: 'Photograph a sore to compare later. Photos stay on your phone and are never uploaded.'
  },
  {
    icon: LogIn,
    title: 'The same account',
    body: 'Sign in with Google, email, Apple or GitHub. Everything you logged on the website is there.'
  }
];

/**
 * The Play listing's own screenshots, captions and all: they are the real
 * Android app, so the page shows exactly what the store does.
 */
const SCREENS = [
  {
    src: '/images/app/2-checkin.webp',
    alt: 'Log it in seconds: the check-in, setting a left-cheek sore to 2 mm and pain 3 of 10'
  },
  {
    src: '/images/app/3-map.webp',
    alt: 'Mark where it hurts: the mouth map on the cheeks view, one open sore'
  },
  {
    src: '/images/app/4-sore.webp',
    alt: 'Watch it shrink: a sore on day 5, its width by day falling from 3.5 to 2 mm'
  },
  {
    src: '/images/app/5-insights.webp',
    alt: 'See your patterns: Insights with days to heal, worst pain and size over time'
  }
];

export default function AppPage() {
  return (
    <>
      <section className="fold-shell fold-split container grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16 lg:py-24">
        <div className="min-w-0">
          <div className="flex items-end gap-3 sm:gap-4">
            <h1 className="min-w-0 max-w-[6em] text-display">
              Your sore log, in your pocket.
            </h1>
            <Kanko
              mood="phone"
              size={144}
              priority
              className="size-24 shrink-0 sm:size-36"
            />
          </div>
          <p className="prose-measure mt-6 text-lg text-muted-foreground">
            Canker Core is free on Android. Mark where a sore is, log its size
            and pain each day, and see whether it is actually shrinking, from
            the phone that is already in your hand when it starts to sting.
          </p>

          <StoreBadges className="-ml-2 mt-8" />
          {!APP_STORE_URL && (
            <p className="mt-3 text-sm text-muted-foreground">
              On iPhone? The App Store version is on its way. Until then, the
              website works in Safari with the same account.
            </p>
          )}
        </div>

        <figure className="mx-auto w-full max-w-[18rem] lg:max-w-none">
          <Image
            src="/images/app/1-today.webp"
            alt="Know if it’s healing: the Today screen, with a 2-day streak, one open sore on the left cheek and this week’s check-ins"
            width={720}
            height={1280}
            priority
            sizes="(min-width: 1024px) 24rem, 18rem"
            className="h-auto w-full rounded-worksheet border border-border shadow-sm"
          />
        </figure>
      </section>

      <section className="fold-first container py-8 sm:py-12">
        <h2 className="text-title">What the app adds</h2>
        <p className="prose-measure mt-2 text-muted-foreground">
          The same log as the website, with the parts only a phone can do.
        </p>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NATIVE.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="min-w-0 rounded-worksheet border border-border bg-card p-5"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-subhead">{title}</h3>
              <p className="mt-1 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container py-8 sm:py-12">
        <h2 className="text-title">Inside the app</h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {SCREENS.map(({ src, alt }) => (
            <li key={src} className="min-w-0">
              <Image
                src={src}
                alt={alt}
                width={720}
                height={1280}
                sizes="(min-width: 1024px) 18rem, 50vw"
                className="h-auto w-full rounded-worksheet border border-border"
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="container py-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-worksheet border border-border bg-card p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="min-w-0">
            <h2 className="text-section">Private on every screen</h2>
            <p className="prose-measure mt-2 text-muted-foreground">
              Your sores are readable only by your own account, in the app and
              on the website. No ads, nothing sold.{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                What is stored
              </Link>
              .
            </p>
          </div>
          <StoreBadges className="-ml-2 shrink-0" />
        </div>
        <p className="prose-measure mt-6 text-xs text-muted-foreground">
          A log, not medical advice. Google Play and the Google Play logo are
          trademarks of Google LLC.
        </p>
      </section>
    </>
  );
}
