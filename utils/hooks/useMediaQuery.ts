'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { useMounted } from '@/utils/hooks/useMounted';

/**
 * Subscribes to a media query.
 *
 * Returns false on the server and on the first client render, then settles.
 * Callers that would flash the wrong layout should gate on `mounted` from
 * useIsCompact below rather than treating the first false as an answer.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

/**
 * True below Tailwind's `lg`, which is where the app switches from a
 * two-column layout to a single column with a detail sheet.
 *
 * `mounted` distinguishes "not compact" from "not known yet". The two
 * layouts are different enough — a sheet is a focus trap — that rendering
 * the wrong one for a frame is worse than rendering neither.
 */
export function useIsCompact() {
  const mounted = useMounted();
  return { isCompact: useMediaQuery('(max-width: 1023px)'), mounted };
}
