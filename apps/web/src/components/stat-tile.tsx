import clsx from 'clsx';

type Tone = 'accent' | 'heal' | 'warn' | 'neutral';

interface StatTileProps {
  /** Sentence case, no trailing colon. */
  label: string;
  value: string;
  unit?: string;
  /** One short line of context, e.g. the sample size or comparison. */
  note?: string;
  tone?: Tone;
  /** Marks the figure as illustrative, not a live number. */
  example?: boolean;
  className?: string;
}

const toneDot: Record<Tone, string> = {
  accent: 'bg-accent',
  heal: 'bg-heal',
  warn: 'bg-warn',
  neutral: 'bg-muted-foreground'
};

export function StatTile({
  label,
  value,
  unit,
  note,
  tone = 'neutral',
  example = false,
  className
}: StatTileProps) {
  return (
    <div
      className={clsx(
        'border-border bg-card shadow-foreground/5 flex flex-col gap-3 rounded-xl border p-5 shadow-sm',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-secondary-foreground flex items-center gap-2 text-sm font-medium">
          <span
            aria-hidden="true"
            className={clsx('size-2 shrink-0 rounded-full', toneDot[tone])}
          />
          {label}
        </p>
        {example && (
          <span className="border-border bg-muted text-muted-foreground rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide">
            Example
          </span>
        )}
      </div>
      <p className="flex items-baseline gap-1.5">
        <span className="text-foreground text-4xl font-semibold">{value}</span>
        {unit && (
          <span className="text-muted-foreground text-base font-medium">{unit}</span>
        )}
      </p>
      {note && <p className="text-muted-foreground text-sm leading-relaxed">{note}</p>}
    </div>
  );
}
