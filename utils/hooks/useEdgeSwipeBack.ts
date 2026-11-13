'use client';

import { useEffect, useRef } from 'react';

import { edgeSwipeAllowed, isEdgeSwipeBack } from '@/utils/gestures';
import { isNative, platform, tap } from '@/utils/native';

/**
 * Back from the left edge, inside the iOS app, on a pushed screen. Mounted
 * by the screen's own back control, so it exists exactly where "back" does.
 * A swipe that reaches the commit distance goes back once, with a tick;
 * there is no drag-to-peek, which would mean holding two screens live in a
 * web view. Elsewhere it does nothing (`edgeSwipeAllowed` says why).
 */
export function useEdgeSwipeBack(onBack: () => void, enabled = true) {
  const back = useRef(onBack);
  useEffect(() => {
    back.current = onBack;
  });

  useEffect(() => {
    if (!enabled || !edgeSwipeAllowed(isNative(), platform())) return;
    let start: { x: number; y: number } | null = null;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      start = e.touches.length === 1 && t ? { x: t.clientX, y: t.clientY } : null;
    };
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!start || !t) return;
      if (isEdgeSwipeBack(start, { x: t.clientX, y: t.clientY })) {
        start = null;
        tap();
        back.current();
      }
    };
    const onEnd = () => {
      start = null;
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [enabled]);
}
