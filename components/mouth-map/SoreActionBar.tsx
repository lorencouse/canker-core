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
import { toast } from '@/components/ui/Toasts/use-toast';
import { useSoreContext } from '@/context/SoreContext';
import {
  deleteSore,
  setSoreHealed,
  upsertSores,
  type ActionResult
} from '@/utils/actions/soreActions';
import { notify, tap } from '@/utils/native';
import { localTimeZone } from '@/utils/readings';

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
    setSnapshot
  } = useSoreContext();
  const [busy, setBusy] = useState(false);

  const failed = (result: ActionResult) => {
    if (result.ok) return false;
    notify('error');
    toast({ variant: 'destructive', title: result.error });
    return true;
  };

  const begin = (next: 'add' | 'edit') => {
    tap();
    setSnapshot(sores);
    if (next === 'add') setSelectedSore(null);
    setMode(next);
  };

  const finish = async () => {
    // Only the sores that changed. State updates replace a sore's object, so
    // anything still referentially in the snapshot was never touched.
    const changed = snapshot
      ? sores.filter((s) => !snapshot.includes(s))
      : sores;
    setBusy(true);
    try {
      const result = await upsertSores(changed, localTimeZone());
      // On failure the session stays open with the edits intact, so the
      // user can retry rather than redo.
      if (failed(result)) return;
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

  const setHealed = async (healedAt: string | null) => {
    if (!selectedSore) return;
    setBusy(true);
    try {
      const result = await setSoreHealed(selectedSore.id, healedAt);
      if (failed(result)) return;
      const updated = { ...selectedSore, healed_at: healedAt };
      setSores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      // A healed sore leaves the map (unless healed ones are shown), so
      // keeping it selected would leave the details pointing at nothing.
      setSelectedSore(healedAt ? null : updated);
      notify('success');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selectedSore) return false;
    setBusy(true);
    try {
      const result = await deleteSore(selectedSore.id);
      if (failed(result)) return false;
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
    <div className="grid grid-cols-2 gap-2">
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
