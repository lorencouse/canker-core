'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * A check-in step's title. It takes focus when it mounts, so a screen
 * reader announces each new step and the keyboard starts from its top
 * rather than from wherever the last step's button was.
 */
export default function StepHeading({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <h2 ref={ref} tabIndex={-1} className="text-title outline-none">
      {children}
    </h2>
  );
}
