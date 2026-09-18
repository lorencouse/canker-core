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
        /*
         * Figure first, label under it. A number is what the eye lands on,
         * and the label is the answer to the question the number raises —
         * putting the label on top makes it an eyebrow the reader has to
         * get past before reaching the point.
         *
         * flex-col-reverse keeps <dt> before <dd> in the DOM, so a screen
         * reader still hears the term before its definition.
         */
        <div
          key={tile.label}
          className="surface-instrument flex flex-col-reverse px-1 pb-1"
        >
          {/* Sentence case. A tracked-out caps label is chrome dressed as
              information, and five of them in a row is a lot of shouting
              for what are one-word nouns. */}
          <dt className="mt-1 text-xs text-muted-foreground">{tile.label}</dt>
          <dd className="tabular truncate font-display text-figure font-semibold">
            {tile.value}
          </dd>
          {tile.hint && (
            <dd className="order-first mt-1 text-xs text-muted-foreground">
              {tile.hint}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
