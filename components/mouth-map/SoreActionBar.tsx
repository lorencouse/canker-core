'use client';

import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSoreContext } from '@/context/SoreContext';
import { deleteSore, upsertSores } from '@/utils/actions/soreActions';
import { notify, tap } from '@/utils/native';

/**
 * The editing actions for the map: add, edit, delete, and the commit pair
 * that closes an editing session.
 *
 * Add and Edit are two-step. Opening a session snapshots the sores; Finish
 * writes them and Cancel restores the snapshot. That is what makes dragging
 * a sore around the map safe to experiment with.
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

  const editing = mode === 'add' || mode === 'edit';

  const begin = (next: 'add' | 'edit') => {
    tap();
    setSnapshot(sores);
    if (next === 'add') setSelectedSore(null);
    setMode(next);
  };

  const finish = async () => {
    setBusy(true);
    try {
      await upsertSores(sores);
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

  const remove = async () => {
    if (!selectedSore) return;
    setBusy(true);
    try {
      await deleteSore(selectedSore.id);
      setSores(sores.filter((s) => s.id !== selectedSore.id));
      setSelectedSore(null);
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
              <Button
                type="button"
                variant="outline"
                size="touch"
                onClick={() => begin('edit')}
              >
                <Pencil aria-hidden="true" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="touch"
                onClick={remove}
                disabled={busy}
                aria-label="Delete this sore"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
