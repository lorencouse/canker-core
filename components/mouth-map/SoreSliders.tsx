import type React from 'react';
import { useState } from 'react';

import { PainField, WidthField } from '@/components/sore/ReadingFields';
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
 * Today's reading for the selected sore: width, pain, and an optional note,
 * taken with the same fields as the Today screen.
 *
 * The first change on a new day appends a reading; every change after that
 * on the same day corrects it, so nudging a value back and forth never
 * produces more than one row.
 */
const SoreSliders: React.FC = () => {
  const { selectedSore, setSelectedSore, setSores, mode } = useSoreContext();

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
    if (selectedSore) setNote(todaysNote(selectedSore));
  }

  if (!selectedSore) return null;

  const loggedToday = hasReadingOn(selectedSore, new Date());

  return (
    <div className="space-y-5 border border-border p-4">
      {/*
        Says which of the two things a change will do, because they look
        identical and are not: one adds a day to the history, the other
        corrects the day already there.
      */}
      <p className="text-sm text-muted-foreground">
        {mode === 'add'
          ? 'Set its first reading. Drag the mark to move it.'
          : loggedToday
            ? 'Correcting today’s reading. Drag the mark to move it.'
            : 'Any change logs today’s reading. Drag the mark to move it.'}
      </p>

      <WidthField
        id="sore-size"
        value={currentSize(selectedSore)}
        onChange={(mm) => commit({ size: mm })}
      />
      <PainField
        id="sore-pain"
        value={currentPain(selectedSore)}
        onChange={(pain) => commit({ pain })}
      />

      <div className="space-y-1.5">
        <Label htmlFor="sore-note" className="text-base font-semibold">
          Anything to note?
        </Label>
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
