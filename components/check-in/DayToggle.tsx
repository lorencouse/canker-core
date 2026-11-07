'use client';

import type { DayLog } from '@/types';
import type { DayPatch } from '@/utils/check-in/patch';
import { cn } from '@/utils/cn';
import { tap } from '@/utils/native';

export type DayChoice = 'today' | 'yesterday';

const CHOICES: { value: DayChoice; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' }
];

/**
 * Which day a habit screen's answer belongs to. Most of a morning check-in
 * is about yesterday, so each screen opens on its own default and this
 * switches it; the screen reloads that day's saved answer when it does.
 */
export default function DayToggle({
  value,
  onChange,
  disabled
}: {
  value: DayChoice;
  onChange: (next: DayChoice) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Which day"
      className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1"
    >
      {CHOICES.map((choice) => {
        const on = choice.value === value;
        return (
          <button
            key={choice.value}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => {
              if (on) return;
              tap();
              onChange(choice.value);
            }}
            className={cn(
              'h-10 min-w-0 truncate rounded-xl px-3 text-[15px] font-extrabold transition-colors coarse:h-11 lg:h-9 lg:text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'disabled:opacity-50',
              on
                ? 'bg-card text-foreground shadow-sm ring-2 ring-inset ring-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}

/** What every habit screen gets from the flow. */
export type HabitStepProps = {
  /** The day logs as this check-in has saved them. */
  logs: DayLog[];
  /** The check-in's clock, shared by every step. */
  now: Date;
  /** The day the screen opens on (`defaultDay`). */
  initialDay: DayChoice;
  /** Saves one answer; false when it failed and the error is already shown. */
  onSave: (day: string, patch: DayPatch) => Promise<boolean>;
  /** Moves on; it may write (the last screen records the check-in done), so the screen waits for it. */
  onNext: () => void | Promise<void>;
  /** Reports a save in flight, so the flow holds its close and skip. */
  onBusy?: (busy: boolean) => void;
};
