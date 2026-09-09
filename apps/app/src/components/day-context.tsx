import type { DateKey, UserDataset } from '@canker/core';
import { cn } from '@canker/ui';
import { useUpsertDailyEntry } from '@/lib/data';
import { entryOn } from '@/lib/derive';

/**
 * Sleep and stress on a 0..4 scale, presented as three plain words. Stored
 * as 0 / 2 / 4 so the insights engine's thresholds (poor sleep <= 1,
 * high stress >= 3) line up with what the user tapped.
 */
const SLEEP = [
  { value: 0, label: 'Poor' },
  { value: 2, label: 'OK' },
  { value: 4, label: 'Good' }
];
const STRESS = [
  { value: 0, label: 'Low' },
  { value: 2, label: 'Medium' },
  { value: 4, label: 'High' }
];

function bucket(
  v: number | null | undefined,
  options: { value: number }[]
): number | null {
  if (v === null || v === undefined) return null;
  // Snap stored values onto the nearest option so imported data still selects.
  return options.reduce(
    (best, o) => (Math.abs(o.value - v) < Math.abs(best - v) ? o.value : best),
    options[0]!.value
  );
}

export function DayContext({ data, date }: { data: UserDataset; date: DateKey }) {
  const upsert = useUpsertDailyEntry();
  const entry = entryOn(data, date);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Segmented
        label="Sleep last night"
        options={SLEEP}
        value={bucket(entry?.sleep_quality, SLEEP)}
        onChange={(v) => upsert.mutate({ entry_date: date, sleep_quality: v })}
      />
      <Segmented
        label="Stress today"
        options={STRESS}
        value={bucket(entry?.stress, STRESS)}
        onChange={(v) => upsert.mutate({ entry_date: date, stress: v })}
      />
    </div>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: { value: number; label: string }[];
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-secondary-foreground text-xs font-medium">{label}</p>
      <div
        role="group"
        aria-label={label}
        className="bg-muted grid grid-cols-3 rounded-lg p-1"
      >
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? null : o.value)}
              className={cn(
                'rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                on
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
