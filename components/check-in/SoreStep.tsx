'use client';

import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Check, Loader2, Plus } from 'lucide-react';

import { PainField, QuickWidthField } from '@/components/sore/ReadingFields';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Sore } from '@/types';
import { cn } from '@/utils/cn';
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
import { runWrite, showFailure } from '@/utils/write-feedback';

import CheckInMap from './CheckInMap';
import PhotoControl from './PhotoControl';
import StepHeading from './StepHeading';
import { useReportBusy } from './useReportBusy';

/**
 * One open sore's reading for today, under the map pinned with that sore
 * picked out. It opens on today's reading when there is one and on the last
 * one otherwise, so "no change" is a single tap on Same, next. Next and
 * Healed write before the flow moves on; Skip moves on without saving.
 *
 * A photo is keyed to today's reading and is written to the device the moment
 * it is taken. With no reading yet today, that is the one Next will append,
 * so its id is chosen up front; a photo taken for it and then left unsaved
 * (Skip, closing the check-in) is deleted. When today's reading already
 * exists, a retake replaces its photo straight away, and Skip keeps the
 * new one.
 */
export default function SoreStep({
  sore,
  allSores,
  doneIds,
  now,
  onChange,
  onNext,
  onBusy
}: {
  sore: Sore;
  /** Every open sore, for the pinned map. */
  allSores: Sore[];
  /** Sores already logged today, ticked on the map. */
  doneIds: ReadonlySet<string>;
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

  /** Today's reading as entered; the one-per-day rule lives in withReading. */
  const entered = () =>
    withReading(sore, { size, pain, note: note.trim() || null }, now, appendId);

  const save = async (): Promise<Sore | null> => {
    const next = entered();
    const result = await runWrite(() =>
      upsertSores([next], localTimeZone())
    );
    if (!result.ok) {
      showFailure(result.error);
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
      const result = await runWrite(() => setSoreHealed(sore.id, healedAt));
      if (!result.ok) {
        showFailure(result.error);
        return false;
      }
      onChange({ ...written, healed_at: healedAt });
      return true;
    });
  };

  const last = latestReading(sore);
  const badge = changed
    ? { text: 'Changed', className: 'bg-win text-win-foreground' }
    : loggedToday
      ? { text: 'Logged today', className: 'bg-accent text-accent-foreground' }
      : {
          text: 'Same as last time',
          className: 'bg-accent text-accent-foreground'
        };

  return (
    <div className="grid gap-4">
      {/* Pinned while the controls scroll, so the sore stays in sight. */}
      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-1 pt-1">
        <CheckInMap
          sores={allSores}
          activeId={sore.id}
          activeReading={{ size, pain }}
          doneIds={doneIds}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <StepHeading>
            <span className="block truncate">{sore.zone}</span>
          </StepHeading>
          <p className="tabular text-sm text-muted-foreground">
            Day {dayNumberOf(sore, now)}
            {last && !loggedToday
              ? ` · last ${last.size} mm, pain ${last.pain}`
              : ''}
          </p>
        </div>
        <span
          className={cn(
            'mt-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold',
            badge.className
          )}
        >
          {badge.text}
        </span>
      </div>

      <QuickWidthField value={size} onChange={setSize} />
      <PainField
        id={`check-in-pain-${sore.id}`}
        label="Pain"
        value={pain}
        onChange={setPain}
      />

      <details
        open={initialNote !== '' || undefined}
        className="group rounded-cell border-2 border-dashed border-control"
      >
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold text-muted-foreground [&::-webkit-details-marker]:hidden">
          Add a note or photo
          <Plus
            aria-hidden="true"
            className="size-5 transition-transform group-open:rotate-45"
          />
        </summary>
        <div className="grid gap-4 px-4 pb-4">
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
        </div>
      </details>

      {/* Pinned to the bottom of the scroll area, so Next is always one tap. */}
      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t-2 border-border bg-background px-4 py-3">
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
          aria-label={`Skip the ${sore.zone.toLowerCase()} sore for now`}
        >
          Skip
        </Button>
        <Button
          type="button"
          size="touch"
          className="min-w-0 flex-1"
          onClick={next}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Check aria-hidden="true" />
          )}
          {changed ? 'Save, next' : loggedToday ? 'Next' : 'Same, next'}
        </Button>
      </div>
    </div>
  );
}
