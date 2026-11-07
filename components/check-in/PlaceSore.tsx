'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

import MouthMap from '@/components/mouth-map/MouthMap';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/Toasts/use-toast';
import { SoreProvider, useSoreContext } from '@/context/SoreContext';
import type { Sore, User } from '@/types';
import { upsertSores } from '@/utils/actions/soreActions';
import { notify, tap } from '@/utils/native';
import { localTimeZone } from '@/utils/readings';

import StepHeading from './StepHeading';

/*
 * The map stamps a placed sore with the user's id, but the server never
 * trusts that field: `upsertSores` writes the session's id instead. So the
 * check-in does not need the signed-in user just to place a sore.
 */
const NO_USER: User = { id: '', email: '', full_name: null, avatar_url: null };

/**
 * The map in add mode, the same placement the map screen's "Mark a new
 * sore" uses: tap to place, tap again to move, or place it by name. The new
 * sore starts on the map's default reading and is written on Add sore.
 *
 * It runs in its own sore context, opened in add mode, so placing here never
 * puts the map on the screen underneath into an editing session.
 */
export default function PlaceSore({
  sores,
  onPlaced,
  onCancel
}: {
  sores: Sore[];
  /** The sore as written. */
  onPlaced: (sore: Sore) => void;
  onCancel: () => void;
}) {
  return (
    <SoreProvider initialSores={sores} initialMode="add">
      <Placement onPlaced={onPlaced} onCancel={onCancel} />
    </SoreProvider>
  );
}

function Placement({
  onPlaced,
  onCancel
}: {
  onPlaced: (sore: Sore) => void;
  onCancel: () => void;
}) {
  const { selectedSore, snapshot } = useSoreContext();
  const [busy, setBusy] = useState(false);
  // The same test the map uses: selected and not there when the session opened.
  const placed =
    selectedSore && snapshot && !snapshot.some((s) => s.id === selectedSore.id)
      ? selectedSore
      : null;

  const add = async () => {
    if (!placed) return;
    tap();
    setBusy(true);
    const fail = (error: string) => {
      notify('error');
      toast({ variant: 'destructive', title: error });
    };
    try {
      const result = await upsertSores([placed], localTimeZone());
      if (!result.ok) return fail(result.error);
      notify('success');
      onPlaced(placed);
    } catch {
      // The request itself failed (offline, server down): stay on the map.
      fail('Could not save your changes. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      <StepHeading>Where is it?</StepHeading>
      <MouthMap
        user={NO_USER}
        placedHint="Tap again to move it. Its reading comes next."
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="touch"
          onClick={() => {
            tap();
            onCancel();
          }}
          disabled={busy}
        >
          Back
        </Button>
        <Button
          type="button"
          size="touch"
          onClick={add}
          disabled={!placed || busy}
        >
          {busy ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Check aria-hidden="true" />
          )}
          Add sore
        </Button>
      </div>
    </div>
  );
}
