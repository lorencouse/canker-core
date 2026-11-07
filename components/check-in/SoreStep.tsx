'use client';

import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Check, Loader2 } from 'lucide-react';

import { PainField, WidthField } from '@/components/sore/ReadingFields';
import SoreSigil from '@/components/sore/SoreSigil';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/Toasts/use-toast';
import type { Sore } from '@/types';
import { setSoreHealed, upsertSores } from '@/utils/actions/soreActions';
import { notify, tap } from '@/utils/native';
import { deletePhotosFor } from '@/utils/sore-photos';
import {
  currentPain,
  currentSize,
  dayNumberOf,
  hasReadingOn,
  latestReading,
  localTimeZone,
  withReading
} from '@/utils/readings';

import PhotoControl from './PhotoControl';
import StepHeading from './StepHeading';
import { useReportBusy } from './useReportBusy';

/**
 * One open sore's reading for today. It opens on today's reading when there
 * is one and on the last one otherwise, so "no change" is a single tap on
 * Next. Next and Healed write before the flow moves on; Not now moves on and
 * writes nothing.
 *
 * A photo is keyed to today's reading. With no reading yet today, that is
 * the one Next will append, so its id is chosen up front; a photo taken for
 * it and then left unsaved (Not now, closing the check-in) is deleted.
 */
export default function SoreStep({
  sore,
  now,
  onChange,
  onNext,
  onBusy
}: {
  sore: Sore;
  /** The check-in's clock, so every write in one check-in lands on the same day. */
  now: Date;
  /** The sore as written, after a save or a heal. */
  onChange: (next: Sore) => void;
  onNext: () => void;
  /** Reports a save in flight, so the flow holds its close and skip. */
  onBusy?: (busy: boolean) => void;
}) {
  const loggedToday = hasReadingOn(sore, now);
  // A note describes its own day, so only today's is brought back.
  const initialNote = loggedToday ? (latestReading(sore)?.note ?? '') : '';
  const [size, setSize] = useState(() => currentSize(sore));
  const [pain, setPain] = useState(() => currentPain(sore));
  const [note, setNote] = useState(initialNote);
  const [busy, setBusy] = useState(false);
  useReportBusy(busy, onBusy);

  const [appendId] = useState(() => uuidv4());
  const readingId = loggedToday ? latestReading(sore)!.id : appendId;
  const [pendingPhoto, setPendingPhoto] = useState(false);
  // Read by the unmount cleanup, which sees only the first render's values.
  const unsavedPhoto = useRef(false);
  useEffect(() => {
    unsavedPhoto.current = pendingPhoto && !loggedToday;
  }, [pendingPhoto, loggedToday]);
  useEffect(
    () => () => {
      if (unsavedPhoto.current) deletePhotosFor([appendId]);
    },
    [appendId]
  );

  const changed =
    size !== currentSize(sore) ||
    pain !== currentPain(sore) ||
    note.trim() !== initialNote.trim() ||
    // A photo for a reading that does not exist yet needs the reading.
    (pendingPhoto && !loggedToday);

  const fail = (error: string) => {
    notify('error');
    toast({ variant: 'destructive', title: error });
  };

  /** Today's reading as entered; the one-per-day rule lives in withReading. */
  const entered = () =>
    withReading(sore, { size, pain, note: note.trim() || null }, now, appendId);

  const save = async (): Promise<Sore | null> => {
    const next = entered();
    const result = await upsertSores([next], localTimeZone());
    if (!result.ok) {
      fail(result.error);
      return null;
    }
    unsavedPhoto.current = false;
    onChange(next);
    return next;
  };

  const run = async (work: () => Promise<boolean>) => {
    setBusy(true);
    try {
      if (await work()) {
        notify('success');
        onNext();
      }
    } catch {
      // The request itself failed (offline, server down): stay on the step.
      fail('Could not save your changes. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    tap();
    run(async () => (await save()) !== null);
  };

  const healed = () => {
    tap();
    run(async () => {
      // An untouched step has nothing new to say about today.
      const written = changed ? await save() : sore;
      if (!written) return false;
      const healedAt = new Date().toISOString();
      const result = await setSoreHealed(sore.id, healedAt);
      if (!result.ok) {
        fail(result.error);
        return false;
      }
      onChange({ ...written, healed_at: healedAt });
      return true;
    });
  };

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <SoreSigil sore={sore} size={44} />
        <div className="min-w-0">
          <StepHeading>
            <span className="block truncate">{sore.zone}</span>
          </StepHeading>
          <p className="tabular text-sm text-muted-foreground">
            Day {dayNumberOf(sore, now)}
            {loggedToday ? ' · logged today' : ''}
          </p>
        </div>
      </div>

      <WidthField
        id={`check-in-size-${sore.id}`}
        value={size}
        onChange={setSize}
      />
      <PainField
        id={`check-in-pain-${sore.id}`}
        value={pain}
        onChange={setPain}
      />

      <div className="space-y-1.5">
        <Label
          htmlFor={`check-in-note-${sore.id}`}
          className="text-base font-semibold"
        >
          Note
        </Label>
        <Textarea
          id={`check-in-note-${sore.id}`}
          rows={2}
          maxLength={500}
          className="resize-none"
          placeholder="Optional"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <PhotoControl
        readingId={readingId}
        onTaken={() => setPendingPhoto(true)}
      />

      <div className="grid gap-2">
        <Button
          type="button"
          size="touch"
          className="w-full"
          onClick={next}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Check aria-hidden="true" />
          )}
          Next
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="touch"
            onClick={healed}
            disabled={busy}
            aria-label={`Mark the ${sore.zone.toLowerCase()} sore healed`}
          >
            Healed
          </Button>
          <Button
            type="button"
            variant="outline"
            size="touch"
            onClick={() => {
              tap();
              onNext();
            }}
            disabled={busy}
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
