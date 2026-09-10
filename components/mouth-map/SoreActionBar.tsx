'use client';

import { useState } from 'react';
import { Check, CheckCircle2, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';

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

/**
 * The editing actions for the map: add, edit, mark healed, delete, and the
 * commit pair that closes an editing session.
 *
 * Add and Edit are two-step. Opening a session snapshots the sores; Done
 * writes them and Cancel restores the snapshot. That is what makes dragging
 * a sore around the map safe to experiment with.
 *
 * Healed and Delete write immediately. Healed is the normal end of a sore's
 * story and keeps its history; Delete is for mistakes, and asks first
 * because on a phone it sits one thumb-width from Edit.
 *
 * Laid out as one full-width row, which on a phone lands directly above the
 * tab bar where the thumb already is, and on a desktop sits under the map at
 * its natural width.
 */
export default function SoreActionBar() {
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const editing = mode === 'add' || mode === 'edit';

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
      const result = await upsertSores(changed);
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
    if (!selectedSore) return;
    setBusy(true);
    try {
      const result = await deleteSore(selectedSore.id);
      if (failed(result)) return;
      setSores((prev) => prev.filter((s) => s.id !== selectedSore.id));
      setSelectedSore(null);
      setConfirmingDelete(false);
      notify('warning');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="touch"
            className="flex-1"
            onClick={cancel}
            disabled={busy}
          >
            <X aria-hidden="true" />
            Cancel
          </Button>
          <Button
            type="button"
            size="touch"
            className="flex-1"
            onClick={finish}
            disabled={busy}
          >
            <Check aria-hidden="true" />
            {busy ? 'Saving…' : 'Done'}
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            size="touch"
            className="flex-1"
            onClick={() => begin('add')}
          >
            <Plus aria-hidden="true" />
            Add a sore
          </Button>
          {selectedSore && (
            <>
              {selectedSore.healed_at ? (
                <Button
                  type="button"
                  variant="outline"
                  size="touch"
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
                    aria-label="Edit this sore"
                    className="px-3"
                  >
                    <Pencil aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="touch"
                    onClick={() => setHealed(new Date().toISOString())}
                    disabled={busy}
                    aria-label="Mark this sore healed"
                    className="px-3"
                  >
                    <CheckCircle2 aria-hidden="true" />
                    Healed
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="outline"
                size="touch"
                onClick={() => setConfirmingDelete(true)}
                disabled={busy}
                aria-label="Delete this sore"
                className="px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </>
          )}
        </>
      )}

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this sore?</DialogTitle>
            <DialogDescription>
              Its readings go with it and it will not appear in your history.
              If it has simply gone away, mark it healed instead.
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
              onClick={remove}
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
