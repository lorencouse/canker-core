import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

import SoreThumb from '@/components/sore/SoreThumb';
import type { Sore } from '@/types';
import { cn } from '@/utils/cn';
import { currentPain, currentSize, dayNumberOf } from '@/utils/readings';

/**
 * One open sore in a list: where it is on the mouth map, its place and latest figures, tapped to
 * open it. `className` carries the grid, because the slots a screen fills
 * decide its columns; `trailing` sits before the chevron and `below` spans
 * the row under the text.
 */
export default function SoreRow({
  sore,
  now,
  onClick,
  className,
  trailing,
  below
}: {
  sore: Sore;
  /** Null until the device's clock is known; the day count waits for it. */
  now: Date | null;
  onClick: () => void;
  className?: string;
  trailing?: ReactNode;
  below?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'press grid w-full items-center text-left [--press-scale:0.98] hover:bg-muted',
        className
      )}
    >
      <SoreThumb sore={sore} size={44} />
      <span className="min-w-0">
        <span className="block truncate font-semibold">{sore.zone}</span>
        <span className="tabular block truncate text-sm text-muted-foreground">
          {now && `Day ${dayNumberOf(sore, now)} · `}
          {currentSize(sore)} mm, pain {currentPain(sore)}
        </span>
      </span>
      {trailing}
      <ChevronRight
        aria-hidden="true"
        className="size-5 text-muted-foreground"
      />
      {below}
    </button>
  );
}
