import type { PropsWithChildren } from 'react';

import { cn } from '@/utils/cn';

/**
 * A readout: a chart, a tally, a table. The recessed surface.
 *
 * One component rather than a Card assembled by hand in each chart, because
 * every instrument on the Insights screen should agree about its heading
 * size, its caption and the space between them — and because the caption is
 * where each figure gets to say what it does and does not mean, which is a
 * slot worth making hard to skip.
 */
export default function Instrument({
  title,
  caption,
  className,
  children
}: PropsWithChildren<{
  title: string;
  /** What the figures mean, and what they do not. */
  caption?: string;
  className?: string;
}>) {
  return (
    <section className={cn('surface-instrument p-4 sm:p-5', className)}>
      {/* A real heading, so the screen has an outline a screen reader can
          navigate. CardTitle was a div wearing heading type. */}
      <h2 className="text-subhead">{title}</h2>
      {caption && (
        <p className="prose-measure mt-1.5 text-sm text-muted-foreground">
          {caption}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
