'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, Plus } from 'lucide-react';

import MouthMap from '@/components/mouth-map/MouthMap';
import { PainField, QuickWidthField } from '@/components/sore/ReadingFields';
import { Button } from '@/components/ui/button';
import { SoreProvider, useSoreContext } from '@/context/SoreContext';
import type { Sore, User } from '@/types';
import { upsertSores } from '@/utils/actions/soreActions';
import { notify, tap } from '@/utils/native';
import {
  currentPain,
  currentSize,
  localTimeZone,
  withReading
} from '@/utils/readings';
import { runWrite, showFailure } from '@/utils/write-feedback';

import StepHeading from './StepHeading';
import { useReportBusy } from './useReportBusy';

/*
 * The map stamps a placed sore with the user's id, but the server never
 * trusts that field: `upsertSores` writes the session's id instead. So the
 * check-in does not need the signed-in user just to place a sore.
 */
const NO_USER: User = { id: '', email: '', full_name: null, avatar_url: null };

/**
 * "Any new sores?" asked on the map itself: tapping the tissue places one,
 * its width and pain are set right here, and Add sore writes it. The screen
 * then starts over for another, until No new sores moves on.
 *
 * The map runs in its own sore context, opened in add mode, so placing here
 * never puts the map on the screen underneath into an editing session. A
 * fresh context per round is also how Cancel and a second sore start clean.
 */
export default function NewSoreAsk({
  sores,
  onAdded,
  onNext,
  onBusy
}: {
  sores: Sore[];
  /** The new sore, already written. */
  onAdded: (sore: Sore) => void;
  onNext: () => void;
  /** Reports a save in flight, so the flow holds its close and skip. */
  onBusy?: (busy: boolean) => void;
}) {
  const [round, setRound] = useState(0);
  return (
    <SoreProvider key={round} initialSores={sores} initialMode="add">
      <Placement
        first={round === 0}
        onAdded={(sore) => {
          onAdded(sore);
          setRound((r) => r + 1);
        }}
        onCancel={() => setRound((r) => r + 1)}
        onNext={onNext}
        onBusy={onBusy}
      />
    </SoreProvider>
  );
}

function Placement({
  first,
  onAdded,
  onCancel,
  onNext,
  onBusy
}: {
  first: boolean;
  onAdded: (sore: Sore) => void;
  onCancel: () => void;
  onNext: () => void;
  onBusy?: (busy: boolean) => void;
}) {
  const { placedSore: placed, commitSore } = useSoreContext();
  const [busy, setBusy] = useState(false);
  useReportBusy(busy, onBusy);

  /** The placed sore's first reading, changed in place so the marker follows. */
  const setReading = (patch: { size?: number; pain?: number }) => {
    if (!placed) return;
    commitSore(withReading(placed, patch, new Date(placed.created_at)));
  };

  const add = async () => {
    if (!placed) return;
    tap();
    setBusy(true);
    try {
      const result = await runWrite(() =>
        upsertSores([placed], localTimeZone())
      );
      if (!result.ok) return showFailure(result.error);
      notify('success');
      onAdded(placed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-1 pt-1">
        <MouthMap user={NO_USER} compact />
      </div>

      {placed ? (
        <>
          <div>
            <StepHeading>
              <span className="block truncate">{placed.zone}</span>
            </StepHeading>
            <p className="text-sm text-muted-foreground">
              Day 1 · tap the map again to move it
            </p>
          </div>
          <QuickWidthField
            value={currentSize(placed)}
            onChange={(size) => setReading({ size })}
          />
          <PainField
            id={`check-in-new-pain-${placed.id}`}
            label="Pain"
            value={currentPain(placed)}
            onChange={(pain) => setReading({ pain })}
          />
        </>
      ) : (
        <div>
          <StepHeading>{first ? 'Any new sores?' : 'Any more?'}</StepHeading>
          <p className="mt-1 text-base text-muted-foreground">
            Tap the map where it is. Cheeks and Lips are in the tabs.
          </p>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t-2 border-border bg-background px-4 py-3">
        {placed ? (
          <>
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
              Cancel
            </Button>
            <Button
              type="button"
              size="touch"
              className="min-w-0 flex-1"
              onClick={add}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus aria-hidden="true" />
              )}
              Add sore
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="touch"
            className="min-w-0 flex-1"
            onClick={() => {
              tap();
              onNext();
            }}
          >
            {first ? 'No new sores' : 'That’s all'}
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
