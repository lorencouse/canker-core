import Image from 'next/image';

/**
 * The hero is the product's actual mechanism rather than a picture of it: the
 * mouth map with sores plotted on it, each tied by a leader line to the
 * measurement it carries. Coordinates are percentages of the map, matching how
 * sores are stored.
 *
 * Colours reference the --sev-* custom properties rather than the helper in
 * utils/getColor, because this renders on the server where the active theme is
 * not yet known; CSS resolves the right ramp on its own.
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
  { id: 'a', x: 38, y: 33, size: 4, pain: 7, day: 4, side: 'left' },
  { id: 'b', x: 64, y: 46, size: 2, pain: 3, day: 2, side: 'right' },
  { id: 'c', x: 45, y: 70, size: 5, pain: 9, day: 1, side: 'left' }
];

/** Where a chip's leader line terminates, in map percentages. */
const anchorFor = (sore: PlottedSore) => (sore.side === 'left' ? 20 : 80);

export default function MouthMapHero() {
  return (
    <figure className="m-0">
      <div className="relative mx-auto aspect-square w-full max-w-[30rem] overflow-hidden rounded-lg border border-border bg-card">
        <Image
          src="/images/diagram/mouth.png"
          alt="A diagram of an open mouth, used to mark where each sore is."
          fill
          priority
          sizes="(max-width: 768px) 100vw, 30rem"
          className="mouth-substrate object-contain"
        />

        {/* Leader lines, drawn beneath the dots. */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
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

        {SORES.map((sore) => (
          <span
            key={sore.id}
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-foreground/25"
            style={{
              left: `${sore.x}%`,
              top: `${sore.y}%`,
              width: `${sore.size * 1.3}%`,
              height: `${sore.size * 1.3}%`,
              backgroundColor: `hsl(var(--sev-${sore.pain}))`
            }}
          />
        ))}

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
