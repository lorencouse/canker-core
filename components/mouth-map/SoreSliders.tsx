import type React from 'react';
import { useState } from 'react';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSoreContext } from '@/context/SoreContext';
import type { Sore } from '@/types';
import {
  currentPain,
  currentSize,
  hasReadingOn,
  latestReading,
  withReading
} from '@/utils/readings';

// The note only belongs to today's reading; yesterday's stays with yesterday.
const todaysNote = (sore: Sore | null | undefined) =>
  sore && hasReadingOn(sore, new Date())
    ? (latestReading(sore)?.note ?? '')
    : '';

/**
 * Today's reading for the selected sore: size, pain, and an optional note.
 *
 * The first change on a new day appends a reading; every change after that
 * on the same day corrects it, so dragging a slider back and forth never
 * produces more than one row.
 */
const SoreSliders: React.FC = () => {
  const { selectedSore, setSelectedSore, setSores } = useSoreContext();

  const [soreSize, setSoreSize] = useState<number>(currentSize(selectedSore));
  const [painLevel, setPainLevel] = useState<number>(currentPain(selectedSore));
  const [note, setNote] = useState<string>(todaysNote(selectedSore));

  const commit = (values: {
    size?: number;
    pain?: number;
    note?: string | null;
  }) => {
    if (!selectedSore) return;
    const updated = withReading(selectedSore, values);
    setSelectedSore(updated);
    setSores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  // Reset when a different sore is picked, not on every keystroke echo.
  const [shownSoreId, setShownSoreId] = useState(selectedSore?.id);
  if (selectedSore?.id !== shownSoreId) {
    setShownSoreId(selectedSore?.id);
    if (selectedSore) {
      setSoreSize(currentSize(selectedSore));
      setPainLevel(currentPain(selectedSore));
      setNote(todaysNote(selectedSore));
    }
  }

  if (!selectedSore) return null;

  const loggedToday = hasReadingOn(selectedSore, new Date());

  return (
    <div className="surface-worksheet space-y-5 p-4 sm:p-5">
      {/*
        Says which of the two things a slider move will do, because they look
        identical on the slider and are not: one adds a day to the history,
        the other corrects the day already there.
      */}
      <p className="text-xs text-muted-foreground">
        {loggedToday
          ? 'Updating today’s reading.'
          : 'Move a slider to log today’s reading.'}
      </p>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="sore-size">How wide is it?</Label>
          {/* The reading, not a tooltip on the handle: it has to stay
              legible while a thumb is covering the handle. */}
          <span className="tabular text-base font-semibold">{soreSize} mm</span>
        </div>
        <Slider
          id="sore-size"
          min={1}
          max={20}
          value={[soreSize]}
          onValueChange={(values) => {
            setSoreSize(values[0]);
            commit({ size: values[0] });
          }}
          aria-label="Sore size in millimetres"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="sore-pain">How much does it hurt?</Label>
          <span className="tabular inline-flex items-center gap-2 text-base font-semibold">
            {/* The same swatch the map will draw, so the number and the
                mark you are about to see agree before you commit. */}
            <span
              className="size-3 rounded-full ring-1 ring-foreground/20"
              style={{ backgroundColor: `hsl(var(--sev-${painLevel}))` }}
            />
            {painLevel} of 10
          </span>
        </div>
        <Slider
          id="sore-pain"
          tone="severity"
          min={1}
          max={10}
          value={[painLevel]}
          onValueChange={(values) => {
            setPainLevel(values[0]);
            commit({ pain: values[0] });
          }}
          aria-label="Pain level from 1 to 10"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sore-note">Anything to note?</Label>
        <Textarea
          id="sore-note"
          value={note}
          rows={2}
          maxLength={500}
          placeholder="Stings when I eat, looks yellow in the middle…"
          className="resize-none"
          onChange={(e) => {
            setNote(e.target.value);
            commit({ note: e.target.value.trim() || null });
          }}
        />
      </div>
    </div>
  );
};

export default SoreSliders;
