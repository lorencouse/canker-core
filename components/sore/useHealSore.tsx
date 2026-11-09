'use client';

import { useState } from 'react';

import { ToastAction } from '@/components/ui/Toasts/toast';
import { toast } from '@/components/ui/Toasts/use-toast';
import type { Sore } from '@/types';
import { setSoreHealed } from '@/utils/actions/soreActions';
import { notify } from '@/utils/native';
import { runWrite, showFailure } from '@/utils/write-feedback';

/*
 * The Undo toast on screen, wherever it was raised from. Module state because
 * a heal from the quick card and an editing session opened on the action bar
 * live in unrelated components, and that session's Cancel restores a snapshot
 * an Undo pressed in the meantime would contradict.
 */
let healedUndo: { dismiss: () => void } | null = null;

/** Withdraw a pending Undo; an editing session is about to snapshot the sores. */
export function dismissHealedUndo(): void {
  healedUndo?.dismiss();
  healedUndo = null;
}

/** Write a sore's healed state, reporting a failure; true when it landed. */
export async function writeHealed(
  soreId: string,
  healedAt: string | null
): Promise<boolean> {
  const result = await runWrite(
    () => setSoreHealed(soreId, healedAt),
    'Could not update the sore. Try again.'
  );
  if (!result.ok) showFailure(result.error);
  return result.ok;
}

/**
 * Mark a sore healed or reopen it, with `onChange` given the sore as written.
 * Healed is one tap, so it is one tap to take back: marking healed offers an
 * Undo. The check-in has no Undo and calls `writeHealed` itself.
 */
export function useHealSore(onChange: (next: Sore) => void) {
  const [busy, setBusy] = useState(false);

  const setHealed = async (
    sore: Sore,
    healedAt: string | null
  ): Promise<boolean> => {
    setBusy(true);
    try {
      if (!(await writeHealed(sore.id, healedAt))) return false;
      onChange({ ...sore, healed_at: healedAt });
      notify('success');
      if (healedAt) {
        healedUndo = toast({
          title: 'Marked healed.',
          action: (
            <ToastAction
              altText="Undo marking this sore healed"
              className="tap-target"
              onClick={() => setHealed(sore, null)}
            >
              Undo
            </ToastAction>
          )
        });
      }
      return true;
    } finally {
      setBusy(false);
    }
  };

  return { busy, setHealed };
}
