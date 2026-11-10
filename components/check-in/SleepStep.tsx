'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

import Measure from '@/components/sore/Measure';
import { Stepper } from '@/components/sore/ReadingFields';
import { Button } from '@/components/ui/button';
import type { DayLog } from '@/types';
import { resolveDay } from '@/utils/check-in/steps';
import { tap } from '@/utils/native';

import type { HabitStepProps } from './habit-step';
import ScalePicker from './ScalePicker';
import SleepImport from './SleepImport';
import StepHeading from './StepHeading';
import StepNextButton from './StepNextButton';
import { useReportBusy } from './useReportBusy';

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
 * Last night's sleep: hours and how well. Always last night, so there is
 * no day to pick; it is saved on today, the day that night ended. Both start empty and both are
 * optional; Next with neither set moves on and writes nothing.
 */
export default function SleepStep({
  logs,
  now,
  onSave,
  onNext,
  onBusy
}: Omit<HabitStepProps, 'initialDay'>) {
  // Sleep is always last night's, kept on the day it ended: today.
  const day = resolveDay('today', now);
  const saved = logs.find((l) => l.day === day);
  const [fields, setFields] = useState(() => fromLog(saved));
  const [busy, setBusy] = useState(false);
  useReportBusy(busy, onBusy);

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
    setBusy(true);
    try {
      const ok =
        // Nothing entered and nothing to clear: not answered, so nothing to write.
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
      <StepHeading>Last night</StepHeading>

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
            <Measure value={fields.hours ?? '–'} unit="h" />
          </output>
        </div>
        {/* Clear sits between the steppers so a stray tap is one tap from
            undone and the screen can still be left unanswered. */}
        <div className="grid grid-cols-3 gap-2">
          <Stepper
            label="Half an hour less"
            onClick={() => stepHours(-HOURS_STEP)}
            disabled={busy || fields.hours === 0}
          >
            <Minus aria-hidden="true" />
          </Stepper>
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full text-muted-foreground"
            aria-label="Clear the hours"
            onClick={() => {
              tap();
              setFields((f) => ({ ...f, hours: null, source: 'manual' }));
            }}
            disabled={busy || fields.hours === null}
          >
            Clear
          </Button>
          <Stepper
            label="Half an hour more"
            onClick={() => stepHours(HOURS_STEP)}
            disabled={busy || fields.hours === MAX_HOURS}
          >
            <Plus aria-hidden="true" />
          </Stepper>
        </div>
        <SleepImport
          day={day}
          onImport={(hours, source) =>
            setFields((f) => ({ ...f, hours: clampHours(hours), source }))
          }
          disabled={busy}
        />
      </div>

      <ScalePicker
        label="How well did you sleep?"
        low="Badly"
        high="Very well"
        value={fields.quality}
        onChange={(quality) => setFields((f) => ({ ...f, quality }))}
        disabled={busy}
      />

      <StepNextButton busy={busy} onClick={next} />
    </div>
  );
}
