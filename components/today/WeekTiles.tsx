import type { ReactNode } from 'react';
import { Moon, Zap } from 'lucide-react';

import { StarMark } from '@/components/graphics/Sparkles';
import type { DayLog } from '@/types';
import { cn } from '@/utils/cn';
import { weekStats } from '@/utils/momentum';

/**
 * The week in three figures, each beside a small coloured icon tile the way
 * the system apps mark a kind of thing. Numbers first, one-word labels. The
 * tiles are Momentum colours only: sunflower for logged days (a win),
 * lavender for trigger days and indigo for sleep. No red: triggers are not
 * pain.
 */
export default function WeekTiles({
  logs,
  today
}: {
  logs: DayLog[];
  today: string | null;
}) {
  const stats = today ? weekStats(logs, today) : null;
  return (
    <dl className="grid grid-cols-3 gap-2">
      <Tile
        icon={<StarMark size={14} />}
        tone="bg-win text-win-foreground"
        label="Logged"
        value={stats ? `${stats.logged}/7` : null}
      />
      <Tile
        icon={<Zap aria-hidden="true" className="size-3.5" />}
        tone="bg-comfort text-win-foreground"
        label="Triggers"
        value={stats ? String(stats.triggerDays) : null}
      />
      <Tile
        icon={<Moon aria-hidden="true" className="size-3.5" />}
        tone="bg-primary text-primary-foreground"
        label="Sleep"
        value={
          stats ? (stats.sleepHours === null ? '–' : `${stats.sleepHours}h`) : null
        }
      />
    </dl>
  );
}

function Tile({
  icon,
  tone,
  label,
  value
}: {
  icon: ReactNode;
  tone: string;
  label: string;
  value: string | null;
}) {
  return (
    <div className="surface-instrument flex min-w-0 flex-col-reverse gap-1">
      {/* dt before dd in the DOM; the icon and figure share the top row and
          the label sits under them. */}
      <dt className="truncate text-sm text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1.5">
        <span
          aria-hidden="true"
          className={cn('grid size-6 shrink-0 place-items-center rounded-cell min-[360px]:size-7', tone)}
        >
          {icon}
        </span>
        <span className="tabular min-w-0 truncate font-display text-lg font-extrabold leading-tight min-[360px]:text-xl">
          {value ?? '\u00a0'}
        </span>
      </dd>
    </div>
  );
}
