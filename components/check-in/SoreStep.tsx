'use client';

import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Check, NotebookPen } from 'lucide-react';

import { StarMark } from '@/components/graphics/Sparkles';

import PainSlider from '@/components/sore/PainSlider';
import WidthRuler from '@/components/sore/WidthRuler';
import { writeHealed } from '@/components/sore/useHealSore';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Sore } from '@/types';
import { upsertSores } from '@/utils/actions/soreActions';
import { notify, tap } from '@/utils/native';
import { deletePhotosFor } from '@/utils/sore-photos';
import {
  currentPain,
  currentSize,
  dayNumberOf,
  hasReadingOn,
  latestReading,
  withReading
} from '@/utils/readings';
import { localTimeZone } from '@/utils/days';
import { runWrite, showFailure } from '@/utils/write-feedback';
import { BusyIcon } from '@/components/ui/busy-icon';

import CheckInMap from './CheckInMap';
import PhotoControl from './PhotoControl';
import StepHeading from './StepHeading';
import { StepFooter, StepPinnedMap } from './StepLayout';
import { useReportBusy } from './useReportBusy';

/**
 * One open sore's reading for today, under the map pinned with that sore
 * picked out. It opens on today's reading when there is one and on the last
 * one otherwise, so "no change" is a single tap on Same, next. Width is a
 * ruler and pain a slider, one control each. Healed is a chip, a status of
 * the sore rather than a way out: with it on, the main button says so and
 * closes the sore. Next writes before the flow moves on; Skip moves on
 * without saving.
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
  const [noteOpen, setNoteOpen] = useState(initialNote !== '');
  const [healing, setHealing] = useState(false);
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
      if (!(await writeHealed(sore.id, healedAt))) return false;
      onChange({ ...written, healed_at: healedAt });
      return true;
    });
  };

  const last = latestReading(sore);
  const meta = loggedToday
    ? 'logged today'
    : last
      ? `was ${last.size} mm, pain ${last.pain}`
      : null;

  return (
    <div className="grid gap-5">
      <StepPinnedMap>
        <CheckInMap
          sores={allSores}
          activeId={sore.id}
          activeReading={{ size, pain }}
          doneIds={doneIds}
        />
      </StepPinnedMap>

      <div className="min-w-0">
        <StepHeading>
          <span className="block truncate">{sore.zone}</span>
        </StepHeading>
        <p className="tabular text-sm text-muted-foreground">
          Day {dayNumberOf(sore, now)}
          {meta ? ` · ${meta}` : ''}
        </p>
      </div>

      <WidthRuler value={size} onChange={setSize} />
      <PainSlider
        id={`check-in-pain-${sore.id}`}
        value={pain}
        onChange={setPain}
      />

      <div className="flex flex-wrap items-center gap-2">
        <PhotoControl
          variant="chip"
          readingId={readingId}
          onTaken={() => setPendingPhoto(true)}
        />
        <Chip
          on={noteOpen}
          icon={NotebookPen}
          onClick={() => {
            tap();
            setNoteOpen((o) => !o);
          }}
        >
          Note
        </Chip>
        <Chip
          on={healing}
          icon={StarMark}
          tone="win"
          onClick={() => {
            tap();
            setHealing((h) => !h);
          }}
        >
          Healed
        </Chip>
      </div>

      {noteOpen && (
        <div className="space-y-1.5">
          <Label htmlFor={`check-in-note-${sore.id}`} className="sr-only">
            Note
          </Label>
          <Textarea
            id={`check-in-note-${sore.id}`}
            rows={2}
            maxLength={500}
            className="resize-none"
            placeholder="A note for today"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}

      <StepFooter>
        <Button
          type="button"
          variant="ghost"
          size="touch"
          className="text-muted-foreground"
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
          onClick={healing ? healed : next}
          disabled={busy}
        >
          <BusyIcon busy={busy}>
            {healing ? <StarMark /> : <Check aria-hidden="true" />}
          </BusyIcon>
          {healing
            ? 'Healed, next'
            : changed
              ? 'Save, next'
              : loggedToday
                ? 'Next'
                : 'Same, next'}
        </Button>
      </StepFooter>
    </div>
  );
}
