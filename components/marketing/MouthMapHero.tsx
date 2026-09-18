import { MapDefs, ViewArtwork } from '@/components/mouth-map/artwork';
import {
  fromPercent,
  radiusFor,
  viewBoxAttr
} from '@/utils/mouth-map/geometry';

/**
 * The hero is the product's actual mechanism rather than a picture of it: the
 * Front view of the mouth map with sores plotted on it, each tied by a leader
 * line to the measurement it carries. Coordinates are percentages of the view,
 * matching how sores are stored.
 *
 * Colours reference the --sev-* custom properties because this renders on the
 * server where the active theme is not yet known; CSS resolves the ramp.
 */
type PlottedSore = {
  id: string;
  x: number;
  y: number;
  /** Millimetres across. */
  size: number;
  /** 1-10. */
  pain: number;
  day: number;
  /** Which way the leader line runs, so chips never cover the map. */
  side: 'left' | 'right';
};

const SORES: PlottedSore[] = [
  { id: 'a', x: 40, y: 22, size: 4, pain: 7, day: 4, side: 'left' },
  { id: 'b', x: 67, y: 62, size: 2, pain: 3, day: 2, side: 'right' },
  { id: 'c', x: 38, y: 82, size: 5, pain: 9, day: 1, side: 'left' }
];

/** Where a chip's leader line terminates, in map percentages. */
const anchorFor = (sore: PlottedSore) => (sore.side === 'left' ? 14 : 86);

export default function MouthMapHero() {
  return (
    <figure className="m-0">
      <div className="relative mx-auto aspect-[390/400] w-full max-w-[30rem] overflow-hidden rounded-lg border border-border bg-card">
        <svg
          viewBox={viewBoxAttr}
          className="block h-full w-full"
          role="img"
          aria-label="The front view of the mouth map with three sores marked."
        >
          <MapDefs p="hero" />
          <ViewArtwork view="front" p="hero" />
          {SORES.map((sore) => {
            const p = fromPercent({ x: sore.x, y: sore.y });
            const r = radiusFor(sore.size, 'front');
            return (
              <g key={sore.id}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r + 2}
                  fill={`hsl(var(--sev-${sore.pain}))`}
                  opacity="0.28"
                  filter="url(#herosoft)"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={`hsl(var(--sev-${sore.pain}))`}
                  stroke="hsl(var(--foreground) / 0.45)"
                  strokeWidth="1"
                />
              </g>
            );
          })}
        </svg>

        {/* Leader lines, drawn over the map but beneath the chips. */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 hidden h-full w-full sm:block"
        >
          {SORES.map((sore) => (
            <line
              key={sore.id}
              x1={sore.x}
              y1={sore.y}
              x2={anchorFor(sore)}
              y2={sore.y}
              stroke="hsl(var(--foreground))"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.45"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Readouts, hidden on narrow screens where the list below takes over. */}
        {SORES.map((sore) => (
          <span
            key={sore.id}
            aria-hidden="true"
            className="tabular absolute hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-card/95 px-2.5 py-1.5 text-xs leading-tight shadow-sm backdrop-blur sm:block"
            style={{
              top: `${sore.y}%`,
              ...(sore.side === 'left' ? { left: '2%' } : { right: '2%' })
            }}
          >
            <span className="font-semibold">{sore.size} mm</span>
            <br />
            <span className="text-muted-foreground">pain {sore.pain}</span>
          </span>
        ))}
      </div>

      <figcaption className="mt-4">
        <ul className="tabular flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground sm:hidden">
          {SORES.map((sore) => (
            <li key={sore.id} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: `hsl(var(--sev-${sore.pain}))` }}
              />
              {sore.size} mm, pain {sore.pain}, day {sore.day}
            </li>
          ))}
        </ul>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Three sores open, tracked since day 1.
        </p>
      </figcaption>
    </figure>
  );
}
