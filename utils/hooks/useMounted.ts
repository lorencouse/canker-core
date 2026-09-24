'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False during the server render and hydration, true after.
 *
 * For anything that only the browser can answer — the resolved theme, a
 * media query, localStorage. A `useEffect(() => setMounted(true))` gets the
 * same result with an extra render pass per component; this reads it off
 * React's own server/client snapshot split instead.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
