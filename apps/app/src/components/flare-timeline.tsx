import { Link } from '@tanstack/react-router';
import {
  addDays,
  daysBetween,
  formatShort,
  painBucket,
  SURFACE_SHORT_LABELS,
  type DateKey,
  type SoreWithLogs
} from '@canker/core';

/**
 * Gantt-style timeline: one row per sore, bar from onset to healed (or today),
 * coloured by the sore's peak pain. Overlap and duration are what people want
 * to see, and a stacked bar chart hides both.
 */
export function FlareTimeline({
  sores,
  start,
  end
}: {
  sores: SoreWithLogs[];
  start: DateKey;
  end: DateKey;
}) {
  const totalDays = Math.max(1, daysBetween(start, end));
  const visible = sores
    .filter(
      (s) => s.onset_date <= end && (s.healed_date === null || s.healed_date >= start)
    )
    .sort((a, b) => (a.onset_date > b.onset_date ? -1 : 1));

  if (visible.length === 0) {
    return <p className="text-muted-foreground text-sm">No sores in this period.</p>;
  }

  // Month ticks for the axis.
  const ticks: { key: DateKey; label: string }[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (d.endsWith('-01') || d === start)
      ticks.push({ key: d, label: formatShort(d).split(' ')[0] ?? '' });
  }

  const pct = (key: DateKey) =>
    `${(Math.min(Math.max(daysBetween(start, key), 0), totalDays) / totalDays) * 100}%`;

  return (
    <div className="flex flex-col gap-1.5">
      {visible.map((s) => {
        const peak = s.logs.reduce((m, l) => Math.max(m, l.pain), 0);
        const from = s.onset_date < start ? start : s.onset_date;
        const to = s.healed_date === null || s.healed_date > end ? end : s.healed_date;
        const left = pct(from);
        const width = `${Math.max(1.5, ((daysBetween(from, to) + 1) / totalDays) * 100)}%`;
        const active = s.healed_date === null;
        return (
          <Link
            key={s.id}
            to="/sores/$soreId"
            params={{ soreId: s.id }}
            className="text-secondary-foreground hover:bg-muted grid grid-cols-[84px_1fr] items-center gap-2 rounded-md py-0.5 text-xs"
          >
            <span className="truncate">{SURFACE_SHORT_LABELS[s.surface]}</span>
            <span className="bg-muted relative block h-3 rounded-full">
              <span
                className={`absolute inset-y-0 rounded-full bg-pain-${painBucket(peak)} ${active ? 'ring-accent/40 ring-2' : ''}`}
                style={{ left, width }}
                title={`${formatShort(s.onset_date)} – ${s.healed_date ? formatShort(s.healed_date) : 'now'}`}
              />
            </span>
          </Link>
        );
      })}
      <div className="text-muted-foreground relative mt-1 h-4 text-[10px]">
        {ticks.map((t) => (
          <span
            key={t.key}
            className="absolute -translate-x-1/2"
            style={{
              left: `calc(84px + (100% - 84px) * ${daysBetween(start, t.key) / totalDays})`
            }}
          >
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
