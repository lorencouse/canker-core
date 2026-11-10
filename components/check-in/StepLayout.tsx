import type { ReactNode } from 'react';

/** Pinned while the controls scroll, so the sore stays in sight. */
export function StepPinnedMap({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-1 pt-1">
      {children}
    </div>
  );
}

/** Pinned to the bottom of the scroll area, so Next is always one tap. */
export function StepFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 flex gap-2 border-t-2 border-border bg-background px-4 py-3">
      {children}
    </div>
  );
}
