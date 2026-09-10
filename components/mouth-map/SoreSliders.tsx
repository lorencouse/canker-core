import type React from 'react';
import { useEffect, useState } from 'react';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useSoreContext } from '@/context/SoreContext';
import { hasReadingOn, latest, withReading } from '@/utils/readings';

const SoreSliders: React.FC = () => {
  const { selectedSore, setSelectedSore, setSores } = useSoreContext();

  const [soreSize, setSoreSize] = useState<number>(
    latest(selectedSore?.size) ?? 3
  );
  const [painLevel, setPainLevel] = useState<number>(
    latest(selectedSore?.pain) ?? 3
  );

  /**
   * Record the value as today's reading. The first change on a new day
   * appends a reading; every change after that on the same day corrects it,
   * so dragging a slider back and forth never produces more than one row.
   */
  const commit = (values: { size?: number; pain?: number }) => {
    if (!selectedSore) return;
    const updated = withReading(selectedSore, values);
    setSelectedSore(updated);
    setSores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleSizeChange = (value: number) => {
    setSoreSize(value);
    commit({ size: value });
  };

  const handlePainChange = (value: number) => {
    setPainLevel(value);
    commit({ pain: value });
  };

  useEffect(() => {
    if (selectedSore) {
      setSoreSize(latest(selectedSore.size) ?? 3);
      setPainLevel(latest(selectedSore.pain) ?? 3);
    }
  }, [selectedSore]);

  if (!selectedSore) return null;

  const loggedToday = hasReadingOn(selectedSore, new Date());

  return (
    <div className="app-card space-y-5 p-4 sm:p-5">
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
          onValueChange={(values) => handleSizeChange(values[0])}
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
          onValueChange={(values) => handlePainChange(values[0])}
          aria-label="Pain level from 1 to 10"
        />
      </div>
    </div>
  );
};

export default SoreSliders;
