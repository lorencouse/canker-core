'use client';

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
              'focus-ring',
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
