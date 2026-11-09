import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

/** A control's spinner while `busy`; otherwise its resting icon, if it has one. */
export function BusyIcon({
  busy,
  children = null
}: {
  busy: boolean;
  children?: ReactNode;
}) {
  return busy ? (
    <Loader2 className="animate-spin" aria-hidden="true" />
  ) : (
    children
  );
}
