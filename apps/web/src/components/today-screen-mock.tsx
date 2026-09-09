import clsx from 'clsx';
import { Check } from 'lucide-react';

interface ChipProps {
  label: string;
  selected: boolean;
}

function Chip({ label, selected }: ChipProps) {
  return (
    <span
      className={clsx(
        'inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium',
        selected
          ? 'border-accent/30 bg-accent-soft text-accent'
          : 'border-border bg-card text-secondary-foreground'
      )}
    >
      {selected && <Check className="size-3" strokeWidth={3} aria-hidden="true" />}
      {label}
    </span>
  );
}

interface MeterProps {
  label: string;
  value: string;
  fraction: number;
  fillClass: string;
  trackClass: string;
}

function Meter({ label, value, fraction, fillClass, trackClass }: MeterProps) {
  const pct = Math.round(Math.min(Math.max(fraction, 0), 1) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{value}</span>
      </div>
      <div className={clsx('relative h-1.5 w-full rounded-full', trackClass)}>
        <div
          className={clsx('absolute inset-y-0 left-0 rounded-full', fillClass)}
          style={{ width: `${pct}%` }}
        />
        <div
          className={clsx(
            'border-card absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-sm',
            fillClass
          )}
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const factors: ChipProps[] = [
  { label: 'Coffee', selected: true },
  { label: 'Citrus', selected: true },
  { label: 'Poor sleep', selected: true },
  { label: 'Benzocaine gel', selected: true },
  { label: 'Stress', selected: false },
  { label: 'SLS toothpaste', selected: false }
];

/**
 * A CSS-only mock of the app's Today screen. Purely decorative; the wrapper is
 * exposed to assistive tech as a single image with a description.
 */
export function TodayScreenMock({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Mock of the Canker Core Today screen: two active sores on flare-up day six, a left cheek sore at 4 millimetres and pain 5 out of 10, today's factors with coffee, citrus, poor sleep and benzocaine gel selected, and a Finish check-in button."
      className={clsx('w-[280px] select-none', className)}
    >
      <div className="border-border bg-foreground/90 shadow-foreground/10 dark:bg-muted rounded-[2.25rem] border p-2 shadow-xl">
        <div className="bg-background relative overflow-hidden rounded-[1.75rem]">
          {/* Status bar */}
          <div className="text-muted-foreground flex items-center justify-between px-6 pt-3 text-[10px] font-medium">
            <span>9:41</span>
            <span
              aria-hidden="true"
              className="bg-foreground/90 dark:bg-card h-4 w-16 rounded-full"
            />
            <span className="font-mono">100%</span>
          </div>

          <div className="flex flex-col gap-3 px-4 pb-4 pt-4">
            {/* Title */}
            <div>
              <p className="font-display text-foreground text-xl font-bold">Today</p>
              <p className="text-muted-foreground text-[11px]">
                2 active sores · flare-up day 6
              </p>
            </div>

            {/* Sore card */}
            <div className="border-border bg-card shadow-foreground/5 rounded-xl border p-3.5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-foreground text-[13px] font-semibold">
                  Left cheek · day 6
                </p>
                <span
                  className="bg-pain-3 inline-flex size-2.5 rounded-full"
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Meter
                  label="Size"
                  value="4 mm"
                  fraction={0.4}
                  fillClass="bg-heal"
                  trackClass="bg-heal-soft"
                />
                <Meter
                  label="Pain"
                  value="5 / 10"
                  fraction={0.5}
                  fillClass="bg-pain-3"
                  trackClass="bg-pain-1"
                />
              </div>
              <div className="mt-3.5 grid grid-cols-2 gap-2">
                <span className="border-border bg-background text-foreground inline-flex h-8 items-center justify-center rounded-md border text-[11px] font-medium">
                  Same as yesterday
                </span>
                <span className="bg-heal-soft text-heal inline-flex h-8 items-center justify-center rounded-md text-[11px] font-medium">
                  Healed
                </span>
              </div>
            </div>

            {/* Second sore, collapsed */}
            <div className="border-border flex items-center justify-between rounded-xl border border-dashed px-3.5 py-2.5">
              <p className="text-secondary-foreground text-[12px] font-medium">
                Lower lip · day 2
              </p>
              <p className="text-muted-foreground text-[11px]">2 mm · pain 2</p>
            </div>

            {/* Factors card */}
            <div className="border-border bg-card shadow-foreground/5 rounded-xl border p-3.5 shadow-sm">
              <p className="text-foreground mb-2.5 text-[13px] font-semibold">
                Today&rsquo;s factors
              </p>
              <div className="flex flex-wrap gap-1.5">
                {factors.map((factor) => (
                  <Chip key={factor.label} {...factor} />
                ))}
              </div>
            </div>

            {/* Primary action */}
            <span className="bg-accent text-accent-foreground mt-1 inline-flex h-10 items-center justify-center rounded-lg text-[13px] font-semibold">
              Finish check-in
            </span>
          </div>

          {/* Home indicator */}
          <div className="flex justify-center pb-2">
            <span aria-hidden="true" className="bg-border h-1 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
