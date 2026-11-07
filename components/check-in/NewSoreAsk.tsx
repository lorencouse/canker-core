'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { Sore } from '@/types';
import { tap } from '@/utils/native';

import PlaceSore from './PlaceSore';
import StepHeading from './StepHeading';

/**
 * "Any new sores?" No moves on; Yes opens the map to place one, and the
 * flow then gives that sore its own step before asking again.
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
  const [placing, setPlacing] = useState(false);

  if (placing) {
    return (
      <PlaceSore
        sores={sores}
        onPlaced={onAdded}
        onCancel={() => setPlacing(false)}
        onBusy={onBusy}
      />
    );
  }

  return (
    <div className="grid gap-6">
      <StepHeading>Any new sores?</StepHeading>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="touch"
          onClick={() => {
            tap();
            onNext();
          }}
        >
          No
        </Button>
        <Button
          type="button"
          size="touch"
          onClick={() => {
            tap();
            setPlacing(true);
          }}
        >
          Yes
        </Button>
      </div>
    </div>
  );
}
