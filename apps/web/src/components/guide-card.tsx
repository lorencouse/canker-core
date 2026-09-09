import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';

import { formatGuideDate, type Guide } from '@/lib/guides';

type GuideCardProps = Pick<
  Guide,
  'slug' | 'title' | 'description' | 'publishedAt' | 'readingMinutes'
>;

export function GuideCard({
  slug,
  title,
  description,
  publishedAt,
  readingMinutes
}: GuideCardProps) {
  return (
    <article className="border-border bg-card shadow-foreground/5 hover:border-accent/40 group relative flex h-full flex-col gap-3 rounded-xl border p-5 shadow-sm motion-safe:transition-colors">
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <time dateTime={publishedAt}>{formatGuideDate(publishedAt)}</time>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden="true" />
          {readingMinutes} min read
        </span>
      </div>
      <h3 className="text-foreground text-lg font-semibold leading-snug">
        <Link
          href={`/guides/${slug}`}
          className="after:absolute after:inset-0 after:rounded-xl"
        >
          {title}
        </Link>
      </h3>
      <p className="text-secondary-foreground flex-1 text-sm leading-relaxed">
        {description}
      </p>
      <p className="text-accent inline-flex items-center gap-1 text-sm font-medium">
        Read the guide
        <ArrowRight
          className="size-4 group-hover:translate-x-0.5 motion-safe:transition-transform"
          aria-hidden="true"
        />
      </p>
    </article>
  );
}
