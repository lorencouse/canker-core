'use client';

import { useState } from 'react';
import { Check, Plus, RotateCcw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { dismissHealedUndo, useHealSore } from '@/components/sore/useHealSore';
import { useSoreContext } from '@/context/SoreContext';
import { deleteSore, upsertSores } from '@/utils/actions/soreActions';
import { cn } from '@/utils/cn';
import { notify, tap } from '@/utils/native';
import { localTimeZone, replaceSore } from '@/utils/readings';
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
function useMapActions() {
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

  const begin = (next: 'add' | 'edit') => {
    tap();
    dismissHealedUndo();
    setSnapshot(sores);
    if (next === 'add') setSelectedSore(null);
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

  const setHealed = (healedAt: string | null) => {
    if (selectedSore) heal.setHealed(selectedSore, healedAt);
  };

  const remove = async () => {
    if (!selectedSore) return false;
    setBusy(true);
    try {
      const result = await runWrite(
        () => deleteSore(selectedSore.id),
        'Could not delete the sore. Try again.'
      );
      if (!result.ok) {
        showFailure(result.error);
        return false;
      }
      // Photos never reached the server, so only this device can delete them.
      await deletePhotosFor(selectedSore.readings.map((r) => r.id));
      setSores((prev) => prev.filter((s) => s.id !== selectedSore.id));
      setSelectedSore(null);
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
          'keyboard-hides fixed inset-x-0 bottom-[calc(var(--tab-bar-h)+var(--safe-bottom))] z-30 border-t border-border bg-background px-4 py-2.5 lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0'
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
        onClick={() => setConfirmingDelete(true)}
        disabled={busy}
      >
        Delete
      </Button>

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this sore?</DialogTitle>
            <DialogDescription>
              Its readings go with it and it will not appear in your history. If
              it has simply gone away, mark it healed instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="touch"
              onClick={() => setConfirmingDelete(false)}
              disabled={busy}
            >
              Keep it
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="touch"
              onClick={async () => {
                if (await remove()) setConfirmingDelete(false);
              }}
              disabled={busy}
            >
              {busy ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
