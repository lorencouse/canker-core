import { MapDefs, ViewArtwork } from '@/components/mouth-map/artwork';
import { fromPercent, viewBoxAttr } from '@/utils/mouth-map/geometry';

/**
 * The article's whole argument in one figure: four sores clustered on one
 * point versus four scattered across the mouth. Same count, same three
 * months, completely different thing to go looking for.
 *
 * The marks are drawn in plain ink rather than off the --sev-* ramp. These
 * are illustrative positions, not readings, and the ramp means pain — giving
 * them a colour from it would assert a number that does not exist.
 */
type Mark = { x: number; y: number };

const CLUSTERED: Mark[] = [
  { x: 24, y: 47 },
  { x: 27, y: 51 },
  { x: 23, y: 54 },
  { x: 28, y: 44 }
];

const SCATTERED: Mark[] = [
  { x: 50, y: 20 },
  { x: 76, y: 58 },
  { x: 38, y: 79 },
  { x: 60, y: 37 }
];

function PatternMap({
  id,
  marks,
  label
}: {
  id: string;
  marks: Mark[];
  label: string;
}) {
  return (
    <div>
      <svg
        viewBox={viewBoxAttr}
        className="block w-full rounded-lg border border-border bg-card"
        role="img"
        aria-label={label}
      >
        <MapDefs p={id} />
        <ViewArtwork view="front" p={id} />
        {marks.map((mark, i) => {
          const p = fromPercent(mark);
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={9}
              fill="hsl(var(--foreground) / 0.62)"
              stroke="hsl(var(--card))"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function PatternContrast() {
  return (
    <figure className="my-10">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <PatternMap
            id="pat-same"
            marks={CLUSTERED}
            label="A mouth map with four sores marked within a few millimetres of each other on the left cheek."
          />
          <p className="mt-3 text-sm">
            <span className="font-semibold">Four sores, one spot.</span>{' '}
            <span className="text-muted-foreground">
              Look for something physical that keeps happening at that point.
            </span>
          </p>
        </div>
        <div>
          <PatternMap
            id="pat-any"
            marks={SCATTERED}
            label="A mouth map with four sores marked in four unrelated places — the roof of the mouth, a cheek, the lower gum and the tongue."
          />
          <p className="mt-3 text-sm">
            <span className="font-semibold">Four sores, four places.</span>{' '}
            <span className="text-muted-foreground">
              Look for something whole-mouth in the days before each one.
            </span>
          </p>
        </div>
      </div>
    </figure>
  );
}
