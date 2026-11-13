import type { ReactNode } from 'react';

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
 * Pinned to the bottom of the scroll area, so Next is always one tap. It
 * runs down over the step's bottom padding to the screen's edge, keeping
 * the home indicator's strip under its buttons rather than under content.
 */
export function StepFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 -mb-[calc(var(--safe-bottom)+1rem)] flex items-center gap-2 border-t border-border bg-background px-4 pb-[calc(var(--safe-bottom)+0.75rem)] pt-3">
      {children}
    </div>
  );
}
