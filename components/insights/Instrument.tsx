import type { PropsWithChildren, ReactNode } from 'react';

import InfoButton from '@/components/ui/info-button';
import { cn } from '@/utils/cn';

/**
 * A readout: a chart, a tally, a table. The recessed surface.
 *
 * One component rather than a Card assembled by hand in each chart, because
 * every instrument on the Insights screen should agree about its heading
 * size and the space under it. What a figure means, and what it does not,
 * still gets its own slot, `info`, but behind an "i" beside the heading so
 * the screen reads as labels and figures. `note` is the one short line that
 * stays visible.
 */
export default function Instrument({
  title,
  note,
  info,
  className,
  children
}: PropsWithChildren<{
  title: string;
  /** One short visible line under the heading, 12 words at most. */
  note?: string;
  /** The method: what the figures mean, and what they do not. */
  info?: ReactNode;
  className?: string;
}>) {
  return (
    <section className={cn('surface-instrument p-4 sm:p-5', className)}>
      <div className="flex items-center gap-2">
        {/* A real heading, so the screen has an outline a screen reader can
            navigate. */}
        <h2 className="min-w-0 truncate text-subhead">{title}</h2>
        {info && <InfoButton title={title}>{info}</InfoButton>}
      </div>
      {note && (
        <p className="tabular mt-0.5 text-sm text-muted-foreground">{note}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
