'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Puts the check-in above the app and takes the app out of reach while it is
 * there.
 *
 * The flow is portalled to the body so the page behind it can be made
 * `inert` without making the flow inert too. Only what is on the body when
 * the check-in opens goes inert: the selects the flow opens later portal
 * their own layers to the body and stay usable. A focus trap would not do,
 * because those layers sit outside the flow's own element. The toasts'
 * region stays live, so an error the flow shows is still announced.
 *
 * On close, focus goes back to whatever had it before, such as the button
 * that opened the check-in.
 */
export default function CheckInHost({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Read while rendering: by the time this effect runs, the first step's
  // heading has already taken focus.
  const [opener] = useState(() =>
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  );

  useEffect(() => {
    const host = hostRef.current;
    const made = Array.from(document.body.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        el !== host &&
        !el.inert &&
        !['SCRIPT', 'STYLE', 'TEMPLATE'].includes(el.tagName) &&
        // Radix's toast viewport is wrapped in this landmark.
        el.getAttribute('role') !== 'region'
    );
    for (const el of made) el.inert = true;
    return () => {
      for (const el of made) el.inert = false;
      // Still on the page means a development re-run, not a close.
      if (host?.isConnected) return;
      if (opener && opener !== document.body && opener.isConnected) {
        opener.focus();
      }
    };
  }, [opener]);

  return createPortal(<div ref={hostRef}>{children}</div>, document.body);
}
