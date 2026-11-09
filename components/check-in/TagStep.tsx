'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import type { DayLog } from '@/types';
import type { DayPatch } from '@/utils/check-in/patch';
import { resolveDay } from '@/utils/check-in/steps';
import { FOOD_TRIGGERS, HEALTH_TRIGGERS, TREATMENTS } from '@/utils/day-log';
import { tap } from '@/utils/native';

import DayToggle, { type DayChoice, type HabitStepProps } from './DayToggle';
import ScalePicker from './ScalePicker';
import StepHeading from './StepHeading';
import { useReportBusy } from './useReportBusy';

type TagKind = 'food' | 'health' | 'treatments';

const SCREENS: Record<
  TagKind,
  { title: string; legend: string; options: readonly string[] }
> = {
  food: {
    title: 'Food',
    legend: 'Anything that might have set one off',
    options: FOOD_TRIGGERS
  },
  health: {
    title: 'Health and mood',
    legend: 'Anything else going on',
    options: HEALTH_TRIGGERS
  },
  treatments: {
    title: 'Treatments',
    legend: 'Anything you tried',
    options: TREATMENTS
  }
};

/** The screen's answer as `log` holds it. */
function fromLog(kind: TagKind, log: DayLog | undefined) {
  const { options } = SCREENS[kind];
  const stored = kind === 'treatments' ? log?.treatments : log?.triggers;
  const selected = (stored ?? []).filter((t) => options.includes(t));
  const answered =
    kind === 'food'
      ? log?.food_answered
      : kind === 'health'
        ? log?.health_answered
        : false;
  return {
    selected,
    // "None today" is how a clean answer was given, so an answered day with
    // nothing ticked shows it picked. Treatments keep no answered flag.
    none: Boolean(answered) && selected.length === 0,
    stress: log?.stress ?? null
  };
}

/**
 * A chip screen over one fixed list: food triggers, health triggers (with
 * the stress scale) or treatments. "None today" is the explicit clean
 * answer and excludes the other chips. Next with nothing picked moves on
 * and writes nothing, so a skipped screen never makes a day look clean.
 */
export default function TagStep({
  kind,
  logs,
  now,
  initialDay,
  onSave,
  onNext,
  onBusy
}: HabitStepProps & { kind: TagKind }) {
  const { title, legend, options } = SCREENS[kind];
  const [choice, setChoice] = useState<DayChoice>(initialDay);
  const day = resolveDay(choice, now);
  const saved = logs.find((l) => l.day === day);
  const [fields, setFields] = useState(() => fromLog(kind, saved));
  const [busy, setBusy] = useState(false);
  useReportBusy(busy, onBusy);

  const pickDay = (next: DayChoice) => {
    setChoice(next);
    setFields(
      fromLog(
        kind,
        logs.find((l) => l.day === resolveDay(next, now))
      )
    );
  };

  const toggle = (option: string) => {
    tap();
    setFields((f) => ({
      ...f,
      none: false,
      selected: f.selected.includes(option)
        ? f.selected.filter((t) => t !== option)
        : [...f.selected, option]
    }));
  };

  const toggleNone = () => {
    tap();
    setFields((f) => ({ ...f, none: !f.none, selected: [] }));
  };

  /** What Next writes, or null when the screen was left unanswered. */
  const patch = (): DayPatch | null => {
    const answered = fields.none || fields.selected.length > 0;
    switch (kind) {
      case 'food':
        return answered ? { food: fields.selected } : null;
      case 'health':
        return answered || fields.stress !== null
          ? { health: { triggers: fields.selected, stress: fields.stress } }
          : null;
      case 'treatments':
        // No answered flag here, so unpicking the day's treatments has to
        // clear them; otherwise an empty screen writes nothing.
        return answered || (saved?.treatments.length ?? 0) > 0
          ? { treatments: fields.selected }
          : null;
    }
  };

  const next = async () => {
    tap();
    const p = patch();
    setBusy(true);
    try {
      if (!p || (await onSave(day, p))) await onNext();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6">
      <StepHeading>{title}</StepHeading>
      <DayToggle value={choice} onChange={pickDay} disabled={busy} />

      <fieldset className="space-y-2" disabled={busy}>
        <legend className="text-base font-semibold">{legend}</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <Chip
              key={option}
              on={fields.selected.includes(option)}
              onClick={() => toggle(option)}
            >
              {option}
            </Chip>
          ))}
          <Chip on={fields.none} onClick={toggleNone}>
            None today
          </Chip>
        </div>
      </fieldset>

      {kind === 'health' && (
        <ScalePicker
          label="Stress"
          low="Calm"
          high="Very stressed"
          value={fields.stress}
          onChange={(stress) => setFields((f) => ({ ...f, stress }))}
          disabled={busy}
        />
      )}

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
