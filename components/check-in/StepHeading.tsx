'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * A check-in step's title. It takes focus when it mounts, so a screen
 * reader announces each new step and the keyboard starts from its top
 * rather than from wherever the last step's button was.
 *
 * No ring, though, even under :focus-visible. A script focus before any tap,
 * as when the check-in starts itself at launch, counts as focus-visible in
 * WebKit, so the global ring boxed the sore's name. The heading is never a
 * control and never in the tab order, so a ring on it tells nobody anything;
 * the controls below keep theirs.
 */
export default function StepHeading({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <h2
      ref={ref}
      tabIndex={-1}
      className="text-title outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
    >
      {children}
    </h2>
  );
}
