import { Info } from 'lucide-react';

import { cn } from '@/utils/cn';

/**
 * Shown once an open sore passes two weeks. Most canker sores heal inside
 * that; one that does not is the textbook reason to have a dentist look.
 * Neutral ink and an info icon, not red — red here means pain.
 */
export default function LongSoreNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'flex gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm',
        className
      )}
    >
      <Info
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <span>
        Over two weeks now. A sore that lasts this long is worth showing a
        dentist or doctor, especially if it is not shrinking.
      </span>
    </p>
  );
}
