import { useEffect, useState } from 'react';
import {
  formatWeekday,
  PAIN_ANCHORS,
  PAIN_MAX,
  PAIN_MIN,
  SIZE_MAX_MM,
  SIZE_MIN_MM,
  sizeReference,
  SURFACE_LABELS,
  type DateKey,
  type SoreWithLogs
} from '@canker/core';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  LevelSlider,
  Textarea
} from '@canker/ui';
import { useToday, useUpsertSoreLog } from '@/lib/data';
import { logOn, previousLog } from '@/lib/derive';

/**
 * The daily observation for one sore on one date. Sliders open on the most
 * recent earlier values so "nothing changed" is a single tap on Save.
 */
export function CheckInSheet({
  sore,
  date,
  open,
  onClose
}: {
  sore: SoreWithLogs;
  date: DateKey;
  open: boolean;
  onClose: () => void;
}) {
  const today = useToday();
  const upsert = useUpsertSoreLog();
  const existing = logOn(sore.logs, date);
  const seed = existing ?? previousLog(sore.logs, date);

  const [size, setSize] = useState(seed?.size_mm ?? 3);
  const [pain, setPain] = useState(seed?.pain ?? 3);
  const [notes, setNotes] = useState(existing?.notes ?? '');

  useEffect(() => {
    if (open) {
      setSize(seed?.size_mm ?? 3);
      setPain(seed?.pain ?? 3);
      setNotes(existing?.notes ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sore.id, date]);

  function save() {
    upsert.mutate({
      sore_id: sore.id,
      log_date: date,
      size_mm: size,
      pain,
      notes: notes.trim() ? notes.trim() : null,
      logged_late: date !== today
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent sheet>
        <DialogHeader>
          <DialogTitle>{SURFACE_LABELS[sore.surface]}</DialogTitle>
          <DialogDescription>
            {date === today ? "Today's check-in" : `Check-in for ${formatWeekday(date)}`}
            {existing ? ' · editing' : seed ? ' · starting from your last entry' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2">
          <LevelSlider
            label="Size"
            value={size}
            min={SIZE_MIN_MM}
            max={SIZE_MAX_MM}
            step={1}
            onChange={setSize}
            format={(v) => `${v} mm`}
            anchors={[{ at: SIZE_MIN_MM, label: sizeReference(size) }]}
          />
          <LevelSlider
            label="Pain"
            value={pain}
            min={PAIN_MIN}
            max={PAIN_MAX}
            step={1}
            onChange={setPain}
            anchors={PAIN_ANCHORS}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="log-notes">Notes</Label>
            <Textarea
              id="log-notes"
              rows={2}
              placeholder="Anything worth remembering about it today"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={save}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
