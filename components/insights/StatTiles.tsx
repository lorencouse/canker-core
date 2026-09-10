import type { Sore } from '@/types';
import {
  medianDaysToHeal,
  mostCommonZone,
  soresStartedSince,
  worstPainSince
} from '@/utils/insights';

/**
 * The headline figures. Plain numbers in text ink — a stat tile is not a
 * chart, and colouring a number teal would make it look like a link. The
 * one exception is the pain swatch, which is data and wears the ramp.
 */
export default function StatTiles({ sores }: { sores: Sore[] }) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
  const open = sores.filter((s) => !s.healed_at).length;
  const median = medianDaysToHeal(sores);
  const worst = worstPainSince(sores, thirtyDaysAgo);
  const common = mostCommonZone(sores);
  const recent = soresStartedSince(sores, thirtyDaysAgo);

  const tiles: { label: string; value: React.ReactNode; hint?: string }[] = [
    { label: 'Open now', value: open },
    {
      label: 'New in 30 days',
      value: recent,
      hint: recent === 1 ? 'sore started' : 'sores started'
    },
    {
      label: 'Typical time to heal',
      value: median === null ? '—' : median,
      hint: median === null ? 'none healed yet' : median === 1 ? 'day, median' : 'days, median'
    },
    {
      label: 'Worst pain, 30 days',
      value:
        worst === null ? (
          '—'
        ) : (
          <span className="inline-flex items-center gap-2">
            <span
              className="size-3 rounded-full ring-1 ring-foreground/20"
              style={{ backgroundColor: `hsl(var(--sev-${worst}))` }}
              aria-hidden="true"
            />
            {worst}
          </span>
        ),
      hint: worst === null ? 'no readings' : 'of 10'
    },
    {
      label: 'Most common spot',
      value: common ? common.zone : '—',
      hint: common ? `${common.count} of ${sores.length}` : undefined
    }
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <div key={tile.label} className="app-card px-4 py-3">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{tile.label}</dt>
          <dd className="tabular mt-1 truncate font-display text-xl font-semibold">{tile.value}</dd>
          {tile.hint && <dd className="text-xs text-muted-foreground">{tile.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
