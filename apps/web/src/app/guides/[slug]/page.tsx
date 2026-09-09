import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';

import { formatGuideDate, getGuide, getGuideSlugs } from '@/lib/guides';
import { siteName } from '@/lib/site';
import { TrackItCallout } from '@/components/track-it-callout';

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string }> {
  return getGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: 'article',
      title: guide.title,
      description: guide.description,
      publishedTime: `${guide.publishedAt}T00:00:00Z`,
      siteName
    }
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const { Content } = guide;

  return (
    <article className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 md:py-16">
      <div className="mx-auto max-w-[65ch]">
        <Link
          href="/guides"
          className="text-secondary-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All guides
        </Link>

        <header className="border-border mt-6 flex flex-col gap-4 border-b pb-8">
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <time dateTime={guide.publishedAt}>{formatGuideDate(guide.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              {guide.readingMinutes} min read
            </span>
          </div>
          <h1 className="text-foreground text-3xl font-bold leading-tight sm:text-4xl">
            {guide.title}
          </h1>
          <p className="text-secondary-foreground text-lg leading-relaxed">
            {guide.description}
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            General information, not medical advice. It does not replace a visit to a
            dentist or doctor.
          </p>
        </header>

        <div className="pt-2">
          <Content />
        </div>

        <TrackItCallout lead={guide.trackIt} />
      </div>
    </article>
  );
}
