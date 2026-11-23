import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

/**
 * Pinned while the controls scroll, so the sore stays in sight. A drag on
 * the map pans or places; it never pulls the sheet down.
 */
export function StepPinnedMap({ children }: { children: ReactNode }) {
  return (
    <div
      data-no-sheet-drag=""
      className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-1 pt-1"
    >
      {children}
    </div>
  );
}

/**
 * A step's column. It fills the sheet's height, so a short step still
 * puts its footer at the foot of the sheet rather than under the content.
 */
export function StepBody({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex flex-1 flex-col gap-6', className)}>
      {children}
    </div>
  );
}

/**
 * The one action bar every step shares: pinned to the bottom of the scroll
 * area, so the way forward is always in the same place under the thumb.
 * `mt-auto` takes a short step's spare height; a long step scrolls under
 * it. It runs down over the step's bottom padding to the screen's edge,
 * keeping the home indicator's strip under its buttons rather than under
 * content.
 */
export function StepFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 -mb-[calc(var(--safe-bottom)+1rem)] mt-auto flex items-center gap-2 border-t border-border bg-background px-4 pb-[calc(var(--safe-bottom)+0.75rem)] pt-3">
      {children}
    </div>
  );
}
