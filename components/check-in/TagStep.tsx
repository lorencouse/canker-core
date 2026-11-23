'use client';

import { useState } from 'react';

import { Chip } from '@/components/ui/chip';
import type { DayLog } from '@/types';
import type { DayPatch } from '@/utils/check-in/patch';
import { resolveDay } from '@/utils/check-in/steps';
import {
  FOOD_TRIGGERS,
  HEALTH_TRIGGERS,
  STRESS_TRIGGER_FROM,
  TREATMENTS
} from '@/utils/day-log';
import { tap } from '@/utils/native';

import DayToggle, { type DayChoice } from './DayToggle';
import type { HabitStepProps } from './habit-step';
import ScalePicker from './ScalePicker';
import StepHeading from './StepHeading';
import { StepBody } from './StepLayout';
import { tagIcon } from './tag-icons';
import StepNextButton from './StepNextButton';
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
  return {
    selected,
    // Only treatments show "None today", and they keep no answered flag, so
    // the chip always opens unpicked.
    none: false,
    stress: log?.stress ?? null
  };
}

/**
 * A chip screen over one fixed list: food triggers, health triggers (with
 * the stress scale) or treatments.
 *
 * On food and health Next never waits on a choice, and nothing picked is
 * the answer "none", written as such; the button says so ("None, next").
 * Food was decided on 2026-11-12 (app-feel review) and health followed on
 * 2026-11-22 (design audit, owner call C1): a bare Next that wrote nothing
 * left the day unanswered, so the streak stalled without saying why.
 *
 * Treatments keep an explicit "None today" chip that excludes the others,
 * and Next with nothing picked writes nothing there: trying nothing is not
 * a finding the streak depends on.
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
        // Nothing picked means nothing eaten that might have set one off.
        return { food: fields.selected };
      case 'health':
        // Nothing picked means nothing else going on, as on food.
        return { health: { triggers: fields.selected, stress: fields.stress } };
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

  // "None, next" only when that is the whole answer: a stress of 4 or 5 is
  // itself a trigger, so the label would be untrue with one picked.
  const saysNone =
    kind !== 'treatments' &&
    fields.selected.length === 0 &&
    (kind === 'food' || fields.stress === null);

  return (
    <StepBody>
      <StepHeading>{title}</StepHeading>
      <DayToggle value={choice} onChange={pickDay} disabled={busy} />

      <fieldset className="space-y-2" disabled={busy}>
        <legend className="text-base font-semibold">{legend}</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <Chip
              key={option}
              icon={tagIcon(option)}
              on={fields.selected.includes(option)}
              onClick={() => toggle(option)}
            >
              {option}
            </Chip>
          ))}
          {kind === 'treatments' && (
            <Chip on={fields.none} onClick={toggleNone}>
              None today
            </Chip>
          )}
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
          note={`A ${STRESS_TRIGGER_FROM} or 5 counts as a trigger for your streak.`}
        />
      )}

      <StepNextButton
        busy={busy}
        onClick={next}
        label={saysNone ? 'None, next' : 'Next'}
      />
    </StepBody>
  );
}
