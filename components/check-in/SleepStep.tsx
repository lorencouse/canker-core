'use client';

import { useState, type ReactNode } from 'react';
import { Check, Loader2, Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { DayLog } from '@/types';
import { resolveDay } from '@/utils/check-in/steps';
import { tap } from '@/utils/native';

import DayToggle, { type DayChoice, type HabitStepProps } from './DayToggle';
import ScalePicker from './ScalePicker';
import StepHeading from './StepHeading';

type Source = NonNullable<DayLog['sleep_source']>;

const MAX_HOURS = 14;
const HOURS_STEP = 0.5;
/** Where the first tap on an empty stepper lands: a typical night, so most people are a tap or two away. */
const FIRST_HOURS = 7;

const clampHours = (h: number) => Math.min(MAX_HOURS, Math.max(0, h));

/** The screen's fields as `log` holds them, or empty when the day has none. */
const fromLog = (log: DayLog | undefined) => ({
  hours: log?.sleep_hours ?? null,
  quality: log?.sleep_quality ?? null,
  // Kept while the hours are untouched, so re-saving an imported night does
  // not relabel it as typed in.
  source: (log?.sleep_source ?? 'manual') as Source
});

/**
 * Last night's sleep: hours and how well. Both start empty and both are
 * optional; Next with neither set moves on and writes nothing.
 */
export default function SleepStep({
  logs,
  now,
  initialDay,
  onSave,
  onNext,
  importSlot
}: HabitStepProps & {
  /** Where "Import from Health" goes once there is one; `fill` sets the hours and their source. */
  importSlot?: (
    fill: (hours: number, source: Exclude<Source, 'manual'>) => void
  ) => ReactNode;
}) {
  const [choice, setChoice] = useState<DayChoice>(initialDay);
  const day = resolveDay(choice, now);
  const saved = logs.find((l) => l.day === day);
  const [fields, setFields] = useState(() => fromLog(saved));
  const [busy, setBusy] = useState(false);

  const pickDay = (next: DayChoice) => {
    setChoice(next);
    setFields(fromLog(logs.find((l) => l.day === resolveDay(next, now))));
  };

  const stepHours = (delta: number) =>
    setFields((f) => ({
      ...f,
      hours: f.hours === null ? FIRST_HOURS : clampHours(f.hours + delta),
      source: 'manual'
    }));

  const next = async () => {
    tap();
    const empty = fields.hours === null && fields.quality === null;
    const hadSleep =
      saved !== undefined &&
      (saved.sleep_hours !== null || saved.sleep_quality !== null);
    // Nothing entered and nothing to clear: not answered, so nothing to write.
    setBusy(true);
    try {
      const ok =
        (empty && !hadSleep) ||
        (await onSave(day, {
          sleep: {
            hours: fields.hours,
            quality: fields.quality,
            source: fields.hours === null ? null : fields.source
          }
        }));
      if (ok) await onNext();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6">
      <StepHeading>Sleep</StepHeading>
      <DayToggle value={choice} onChange={pickDay} disabled={busy} />

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <span id="check-in-sleep-hours" className="text-base font-semibold">
            Hours asleep
          </span>
          <output
            aria-labelledby="check-in-sleep-hours"
            aria-live="polite"
            className="tabular font-display text-xl font-semibold leading-none"
          >
            {fields.hours ?? '–'}{' '}
            <small className="font-sans text-sm font-normal text-muted-foreground">
              h
            </small>
          </output>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full px-0 [&_svg]:size-5"
            aria-label="Half an hour less"
            onClick={() => {
              tap();
              stepHours(-HOURS_STEP);
            }}
            disabled={busy || fields.hours === 0}
          >
            <Minus aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full px-0 [&_svg]:size-5"
            aria-label="Half an hour more"
            onClick={() => {
              tap();
              stepHours(HOURS_STEP);
            }}
            disabled={busy || fields.hours === MAX_HOURS}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
        {importSlot?.((hours, source) =>
          setFields((f) => ({ ...f, hours: clampHours(hours), source }))
        )}
      </div>

      <ScalePicker
        label="How well did you sleep?"
        low="Badly"
        high="Very well"
        value={fields.quality}
        onChange={(quality) => setFields((f) => ({ ...f, quality }))}
        disabled={busy}
      />

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
    </div>
  );
}
