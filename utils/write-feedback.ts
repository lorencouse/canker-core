'use client';

import { toast } from '@/components/ui/Toasts/use-toast';
import type { ActionResult } from '@/utils/actions/session';
import { notify } from '@/utils/native';

const SAVE_FAILED = 'Could not save your changes. Try again.';

/** A write that did not land: the error haptic and the destructive toast. */
export function showFailure(message: string): void {
  notify('error');
  toast({ variant: 'destructive', title: message });
}

/**
 * Run a server action so that its failure is always a value. An action
 * returns `{ ok: false }` for what it refuses, but the call itself rejects
 * when the device is offline or the server is down.
 */
export async function runWrite(
  action: () => Promise<ActionResult>,
  fallback: string = SAVE_FAILED
): Promise<ActionResult> {
  try {
    return await action();
  } catch {
    return { ok: false, error: fallback };
  }
}
