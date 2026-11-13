'use client';

import { useState } from 'react';
import { Check, Plus, RotateCcw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useActionSheet } from '@/components/ui/action-sheet';
import { dismissHealedUndo, useHealSore } from '@/components/sore/useHealSore';
import { useSoreContext } from '@/context/SoreContext';
import type { Sore } from '@/types';
import { deleteSore, upsertSores } from '@/utils/actions/soreActions';
import { cn } from '@/utils/cn';
import { notify, tap } from '@/utils/native';
import { replaceSore } from '@/utils/readings';
import { localTimeZone } from '@/utils/days';
import { deletePhotosFor } from '@/utils/sore-photos';
import { runWrite, showFailure } from '@/utils/write-feedback';

/**
 * The map's editing actions: add, log today, mark healed, delete, and the
 * commit pair that closes an editing session.
 *
 * Add and Log today are two-step. Opening a session snapshots the sores;
 * Done writes them and Cancel restores the snapshot. That is what makes
 * dragging a sore around the map safe to experiment with.
 *
 * Healed and Delete write immediately. Healed is the normal end of a sore's
 * story and keeps its history; Delete is for mistakes, so it is the quietest
 * of the three and asks first.
 *
 * The session state lives in the sore context, so the pieces can sit in
 * different places on the screen: the add button under the title, Cancel and
 * Done under the map, the rest in the selected sore's detail.
 */
export function useMapActions() {
  const {
    sores,
    setSores,
    selectedSore,
    setSelectedSore,
    mode,
    setMode,
    snapshot,
    setSnapshot,
    changedSores
  } = useSoreContext();
  const [saving, setBusy] = useState(false);
  const heal = useHealSore((updated) => {
    setSores((prev) => replaceSore(prev, updated));
    // A healed sore leaves the map (unless healed ones are shown), so
    // keeping it selected would leave the details pointing at nothing.
    setSelectedSore(updated.healed_at ? null : updated);
  });
  const busy = saving || heal.busy;

  /** Opens an editing session; `edit` on `sore` when a long press named one. */
  const begin = (next: 'add' | 'edit', sore?: Sore) => {
    tap();
    dismissHealedUndo();
    setSnapshot(sores);
    if (next === 'add') setSelectedSore(null);
    else if (sore) setSelectedSore(sore);
    setMode(next);
  };

  const finish = async () => {
    setBusy(true);
    try {
      const result = await runWrite(() =>
        upsertSores(changedSores, localTimeZone())
      );
      // On failure the session stays open with the edits intact, so the
      // user can retry rather than redo.
      if (!result.ok) return showFailure(result.error);
      notify('success');
      setSnapshot(null);
      setMode('view');
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    tap();
    if (snapshot) setSores(snapshot);
    setSnapshot(null);
    setSelectedSore(null);
    setMode('view');
  };

  /** On the selected sore, or the one a long press named. */
  const setHealed = (healedAt: string | null, sore = selectedSore) => {
    if (sore) heal.setHealed(sore, healedAt);
  };

  const remove = async (sore = selectedSore) => {
    if (!sore) return false;
    setBusy(true);
    try {
      const result = await runWrite(
        () => deleteSore(sore.id),
        'Could not delete the sore. Try again.'
      );
      if (!result.ok) {
        showFailure(result.error);
        return false;
      }
      // Photos never reached the server, so only this device can delete them.
      await deletePhotosFor(sore.readings.map((r) => r.id));
      setSores((prev) => prev.filter((s) => s.id !== sore.id));
      setSelectedSore((current) => (current?.id === sore.id ? null : current));
      notify('warning');
      return true;
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    mode,
    selectedSore,
    editing: mode === 'add' || mode === 'edit',
    begin,
    finish,
    cancel,
    setHealed,
    remove
  };
}

/** The screen's one primary action. Hidden while a session is open. */
export function MarkSoreButton({ className }: { className?: string }) {
  const { editing, begin } = useMapActions();
  if (editing) return null;
  return (
    <Button
      type="button"
      size="touch"
      className={className}
      onClick={() => begin('add')}
    >
      <Plus aria-hidden="true" />
      Mark a new sore
    </Button>
  );
}

/**
 * Cancel and Done, wherever the hand already is: under the map while a new
 * sore has not been placed yet, and under the reading fields once a sore is
 * being placed or logged.
 */
export function EditingBar({ place }: { place: 'map' | 'detail' }) {
  const { editing, busy, mode, selectedSore, cancel, finish } = useMapActions();
  if (!editing) return null;
  if ((place === 'detail') !== Boolean(selectedSore)) return null;
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2',
        /*
         * Once a sore is being placed or logged, its reading runs below the
         * map and Done would be a scroll away; on a phone it floats over the
         * tab bar instead, like Today's Save.
         */
        place === 'detail' &&
          'floating-action-bar keyboard-hides'
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="touch"
        onClick={cancel}
        disabled={busy}
      >
        <X aria-hidden="true" />
        Cancel
      </Button>
      <Button type="button" size="touch" onClick={finish} disabled={busy}>
        <Check aria-hidden="true" />
        {busy ? 'Saving…' : mode === 'add' ? 'Done' : 'Save'}
      </Button>
    </div>
  );
}

/**
 * The selected sore's own actions. A grid, so it can never be wider than
 * its column: four labelled buttons in one row once pushed a phone page
 * out to 437px.
 */
export default function SoreActions() {
  const { busy, editing, selectedSore, begin, setHealed, remove } =
    useMapActions();
  const actions = useActionSheet();

  if (!selectedSore || editing) return null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)_auto] items-center gap-2">
      {selectedSore.healed_at ? (
        <Button
          type="button"
          variant="outline"
          size="touch"
          className="col-span-2"
          onClick={() => setHealed(null)}
          disabled={busy}
        >
          <RotateCcw aria-hidden="true" />
          Reopen
        </Button>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="touch"
            onClick={() => begin('edit')}
          >
            Log today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="touch"
            onClick={() => setHealed(new Date().toISOString())}
            disabled={busy}
            aria-label="Mark this sore healed"
          >
            Healed
          </Button>
        </>
      )}
      <Button
        type="button"
        variant="link"
        className="h-12 px-2 text-base text-muted-foreground underline hover:text-foreground"
        onClick={async () => {
          if ((await confirmDeleteSore(actions.ask)) && selectedSore)
            remove(selectedSore);
        }}
        disabled={busy}
      >
        Delete
      </Button>
      {actions.sheet}

    </div>
  );
}

/**
 * Asks before a sore is deleted, as the system's destructive action sheet.
 * Healed is the normal end of a sore, so the sheet says so.
 */
export async function confirmDeleteSore(
  ask: ReturnType<typeof useActionSheet>['ask']
): Promise<boolean> {
  const pick = await ask(
    'Delete this sore?',
    [{ title: 'Delete sore', style: 'destructive' }],
    'Its readings go too. If it went away, mark it healed.'
  );
  return pick === 0;
}
