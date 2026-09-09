import type * as React from 'react';
import { painBucket } from '@canker/core';

import { cn } from '../lib/cn';

export interface PainDotProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  /** Pain 0..10. Ignored when `healed` is true. */
  pain: number;
  healed?: boolean;
  size?: 'sm' | 'md';
}

/** Full class strings so Tailwind can see them at scan time. */
const BUCKET_BG: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'bg-pain-1',
  2: 'bg-pain-2',
  3: 'bg-pain-3',
  4: 'bg-pain-4',
  5: 'bg-pain-5'
};

/** A filled circle coloured by the pain bucket, or the heal colour once healed. */
function PainDot({
  pain,
  healed = false,
  size = 'md',
  className,
  ...props
}: PainDotProps) {
  const label = healed ? 'Healed' : `Pain ${Math.round(pain)} of 10`;
  return (
    <span
      data-slot="pain-dot"
      role="img"
      aria-label={label}
      className={cn(
        'ring-card inline-block shrink-0 rounded-full ring-2',
        size === 'sm' ? 'size-2.5' : 'size-3.5',
        healed ? 'bg-heal' : BUCKET_BG[painBucket(pain)],
        className
      )}
      {...props}
    />
  );
}

export { PainDot };
