'use client';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { DayLog } from '@/types';
import { FOOD_TRIGGERS, HEALTH_TRIGGERS, TREATMENTS } from '@/utils/day-log';
import { tap } from '@/utils/native';

/**
 * The day's log: suspected triggers, treatments tried, and a note.
 *
 * Chips rather than checkboxes because the list is long and the answer is
 * usually two or three items; a wrapped row of toggles scans faster than a
 * column of boxes and needs no scrolling on a phone.
 */
export default function DayLogForm({
  log,
  onChange,
  yesterdaysTreatments = []
}: {
  log: DayLog;
  onChange: (next: DayLog) => void;
  /** Offered back in one tap while today has no treatments of its own. */
  yesterdaysTreatments?: readonly string[];
}) {
  const toggle = (field: 'triggers' | 'treatments', value: string) => {
    tap();
    const has = log[field].includes(value);
    onChange({
      ...log,
      [field]: has
        ? log[field].filter((v) => v !== value)
        : [...log[field], value]
    });
  };

  // Stress and Poor sleep now come from the habit fields, and older logs may
  // carry them (or other retired tags) as ticked values; keep those visible so
  // they can still be unticked.
  const offered: readonly string[] = [...FOOD_TRIGGERS, ...HEALTH_TRIGGERS];
  const legacyTicked = log.triggers.filter((t) => !offered.includes(t));

  return (
    <div className="space-y-5">
      <ChipGroup
        label="Food and drink that might have set one off"
        options={FOOD_TRIGGERS}
        selected={log.triggers}
        onToggle={(v) => toggle('triggers', v)}
      />
      <ChipGroup
        label="Anything else that might have set one off"
        options={HEALTH_TRIGGERS}
        selected={log.triggers}
        onToggle={(v) => toggle('triggers', v)}
      />
      {legacyTicked.length > 0 && (
        <ChipGroup
          label="Tagged earlier"
          options={legacyTicked}
          selected={log.triggers}
          onToggle={(v) => toggle('triggers', v)}
        />
      )}
      <ChipGroup
        label="Anything you tried"
        options={TREATMENTS}
        selected={log.treatments}
        onToggle={(v) => toggle('treatments', v)}
        repeat={
          yesterdaysTreatments.length > 0 && log.treatments.length === 0
            ? {
                label: `Repeat yesterday’s (${yesterdaysTreatments.length})`,
                onRepeat: () => {
                  tap();
                  onChange({ ...log, treatments: [...yesterdaysTreatments] });
                }
              }
            : undefined
        }
      />
      <div className="space-y-1.5">
        <Label htmlFor="day-note" className="text-base font-semibold">
          Note
        </Label>
        <Textarea
          id="day-note"
          rows={3}
          maxLength={1000}
          className="resize-none"
          placeholder="Slept badly, big presentation, new toothpaste…"
          value={log.note ?? ''}
          onChange={(e) => onChange({ ...log, note: e.target.value || null })}
        />
      </div>
    </div>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
  repeat
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  repeat?: { label: string; onRepeat: () => void };
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-base font-semibold">{label}</legend>
      {repeat && (
        <Button
          type="button"
          variant="link"
          className="h-11 px-0.5 text-base font-semibold"
          onClick={repeat.onRepeat}
        >
          {repeat.label}
        </Button>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option}
            on={selected.includes(option)}
            onClick={() => onToggle(option)}
          >
            {option}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}
