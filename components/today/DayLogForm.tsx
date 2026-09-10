'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { DayLog } from '@/types';
import { cn } from '@/utils/cn';
import { TREATMENTS, TRIGGERS } from '@/utils/day-log';
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
  onChange
}: {
  log: DayLog;
  onChange: (next: DayLog) => void;
}) {
  const toggle = (field: 'triggers' | 'treatments', value: string) => {
    tap();
    const has = log[field].includes(value);
    onChange({
      ...log,
      [field]: has ? log[field].filter((v) => v !== value) : [...log[field], value]
    });
  };

  return (
    <div className="app-card space-y-5 p-4">
      <ChipGroup
        label="Anything that might have set one off?"
        options={TRIGGERS}
        selected={log.triggers}
        onToggle={(v) => toggle('triggers', v)}
      />
      <ChipGroup
        label="Anything you tried?"
        options={TREATMENTS}
        selected={log.treatments}
        onToggle={(v) => toggle('treatments', v)}
      />
      <div className="space-y-1.5">
        <Label htmlFor="day-note">Notes</Label>
        <Textarea
          id="day-note"
          rows={2}
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
  onToggle
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(option)}
              className={cn(
                // 40px tall on touch: a chip is tapped, not aimed at.
                'inline-flex h-10 items-center rounded-full border px-3.5 text-sm transition-colors lg:h-8 lg:text-[13px]',
                on
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
