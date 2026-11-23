'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

import Measure from '@/components/sore/Measure';
import { Stepper } from '@/components/sore/ReadingFields';
import type { DayLog } from '@/types';
import { resolveDay } from '@/utils/check-in/steps';
import { cn } from '@/utils/cn';
import {
  POOR_SLEEP_QUALITY_UPTO,
  SHORT_SLEEP_UNDER_HOURS
} from '@/utils/day-log';
import { tap } from '@/utils/native';

import type { HabitStepProps } from './habit-step';
import ScalePicker, { answerKeyClass } from './ScalePicker';
import SleepImport from './SleepImport';
import StepHeading from './StepHeading';
import { StepBody } from './StepLayout';
import StepNextButton from './StepNextButton';
import { useReportBusy } from './useReportBusy';

type Source = NonNullable<DayLog['sleep_source']>;

const MAX_HOURS = 14;
const HOURS_STEP = 0.5;
/** Where the first + on an empty answer lands: a typical night. */
const FIRST_HOURS = 7;

/**
 * Every common night as one tap. "9+" records 9 and stays picked for
 * anything longer, so a nudge past it does not leave the row blank.
 */
const HOUR_PRESETS = [
  { hours: 5, label: '5' },
  { hours: 6, label: '6' },
  { hours: 7, label: '7' },
  { hours: 7.5, label: '7.5' },
  { hours: 8, label: '8' },
  { hours: 9, label: '9+' }
] as const;
const LAST_PRESET = HOUR_PRESETS[HOUR_PRESETS.length - 1].hours;

const presetOn = (value: number | null, preset: number) =>
  value !== null &&
  (preset === LAST_PRESET ? value >= preset : value === preset);

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
    <StepBody>
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
        {/* The usual answers in one tap. Tapping the picked one again
            clears it, as on the scales, so the screen can still be left
            unanswered. */}
        <div
          role="group"
          aria-labelledby="check-in-sleep-hours"
          className="grid grid-cols-6 gap-1.5"
        >
          {HOUR_PRESETS.map(({ hours, label }) => {
            const on = presetOn(fields.hours, hours);
            return (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                aria-label={`${label} hours`}
                disabled={busy}
                onClick={() => {
                  tap();
                  setFields((f) => ({
                    ...f,
                    hours: on ? null : hours,
                    source: 'manual'
                  }));
                }}
                className={cn(answerKeyClass(on), 'px-0 text-base')}
              >
                {label}
              </button>
            );
          })}
        </div>
        {/* Anything between the presets is a half-hour nudge away. */}
        <div className="flex items-center gap-2 pt-1">
          <Stepper
            label="Half an hour less"
            onClick={() => stepHours(-HOURS_STEP)}
            disabled={busy || fields.hours === null || fields.hours === 0}
            className="size-11 shrink-0 rounded-full"
          >
            <Minus aria-hidden="true" />
          </Stepper>
          <Stepper
            label="Half an hour more"
            onClick={() => stepHours(HOURS_STEP)}
            disabled={busy || fields.hours === MAX_HOURS}
            className="size-11 shrink-0 rounded-full"
          >
            <Plus aria-hidden="true" />
          </Stepper>
          <span className="min-w-0 truncate text-sm text-muted-foreground">
            Nudge by half an hour
          </span>
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
        note={`Under ${SHORT_SLEEP_UNDER_HOURS} hours, or a ${POOR_SLEEP_QUALITY_UPTO} or lower, counts as a trigger for your streak.`}
      />

      <StepNextButton busy={busy} onClick={next} />
    </StepBody>
  );
}
