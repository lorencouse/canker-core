import type { CSSProperties, ReactNode } from 'react';
import { CalendarPlus, CircleDot, Droplet, HeartPulse, type LucideIcon } from 'lucide-react';

import type { Sore } from '@/types';
import { medianDaysToHeal, medianDaysToHealSince, soresStartedSince, worstPainSince } from '@/utils/insights';
import { sevFill } from '@/utils/severity';
import { cn } from '@/utils/cn';

type Tile = {
  label: string;
  value: number | null;
  /** Small text after the figure, such as "/10". */
  unit?: string;
  icon: LucideIcon;
  /** The icon tile's colours. */
  tone: string;
  style?: CSSProperties;
};

/**
 * Four headline figures, each with its icon tile beside the number and a
 * one or two word label under it. The figures stay in ink: the only colour
 * that carries data here is the worst-pain tile, which wears the severity
 * ramp so it matches every pain dot in the app. `since` is the start of the
 * chosen range, or null for all time.
 */
export default function StatTiles({ sores, since }: { sores: Sore[]; since: Date | null }) {
  const open = sores.filter((s) => !s.healed_at).length;
  const started = since ? soresStartedSince(sores, since) : sores.length;
  const heal = since ? medianDaysToHealSince(sores, since) : medianDaysToHeal(sores);
  const worst = worstPainSince(sores, since ?? new Date(0));
  const level = worst ?? 1;

  const tiles: Tile[] = [
    { label: 'Open now', value: open, icon: CircleDot, tone: 'bg-secondary text-primary' },
    {
      label: since ? 'New' : 'Sores',
      value: started,
      icon: CalendarPlus,
      tone: 'bg-secondary text-primary'
    },
    {
      label: 'Days to heal',
      value: heal,
      icon: HeartPulse,
      tone: 'bg-win text-win-foreground'
    },
    {
      label: 'Worst pain',
      value: worst,
      unit: '/10',
      icon: Droplet,
      tone: '',
      style:
        worst === null
          ? undefined
          : {
              backgroundColor: sevFill(level),
              color: `hsl(var(--sev-ink-${level > 5 ? 'hi' : 'lo'}))`
            }
    }
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <StatTile key={tile.label} tile={tile} />
      ))}
    </dl>
  );
}

function StatTile({ tile }: { tile: Tile }) {
  const Icon = tile.icon;
  const empty = tile.value === null;
  let figure: ReactNode = empty ? (
    <span className="text-subhead text-muted-foreground">None</span>
  ) : (
    tile.value
  );
  if (!empty && tile.unit)
    figure = (
      <>
        {figure}
        <span className="text-sm font-normal text-muted-foreground">{tile.unit}</span>
      </>
    );

  return (
    /*
     * flex-col-reverse keeps <dt> before <dd> in the DOM, so a screen reader
     * hears the label before the figure, while the eye lands on the figure.
     */
    <div className="surface-instrument flex min-w-0 flex-col-reverse justify-end">
      <dt className="mt-1 truncate text-sm text-muted-foreground">{tile.label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-cell',
            empty ? 'bg-muted text-muted-foreground' : tile.tone
          )}
          style={empty ? undefined : tile.style}
        >
          <Icon className="size-[18px]" />
        </span>
        <span className="tabular truncate font-display text-figure font-semibold">
          {figure}
        </span>
      </dd>
    </div>
  );
}
