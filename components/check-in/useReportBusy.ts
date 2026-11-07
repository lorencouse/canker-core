'use client';

import { useEffect } from 'react';

/**
 * Tells the flow while a step is writing, so its ✕ and Skip wait for the
 * save instead of closing over it. A step that unmounts mid-save (it moved
 * on) reports idle on the way out, so the flow is never left disabled.
 */
export function useReportBusy(
  busy: boolean,
  onBusy: ((busy: boolean) => void) | undefined
) {
  useEffect(() => {
    if (!busy) return;
    onBusy?.(true);
    return () => onBusy?.(false);
  }, [busy, onBusy]);
}
