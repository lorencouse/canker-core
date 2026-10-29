import { MapDefs, ViewArtwork } from '@/components/mouth-map/artwork';
import { fromPercent, radiusFor } from '@/utils/mouth-map/geometry';

/**
 * Four sores over a year, all on one spot of the lower gum: the "same place
 * again" pattern the recurrence articles are about, drawn on the product's
 * own map rather than described. Cropped to the lower half of the Front
 * view, where the cluster sits.
 */
const RETURNS = [
  { x: 33.5, y: 85.5, size: 3, pain: 4 },
  { x: 35.5, y: 87, size: 4, pain: 6 },
  { x: 34, y: 88.5, size: 2.5, pain: 3 },
  { x: 36.5, y: 85, size: 3.5, pain: 5 }
];

export default function RecurrenceSketch({
  className
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="20 210 350 190"
      className={className}
      role="img"
      aria-label="The lower half of the mouth map with four sores from one year, all within a few millimetres of each other on the lower gum."
    >
      <MapDefs p="recur" />
      <ViewArtwork view="front" p="recur" />
      {RETURNS.map((sore, i) => {
        const p = fromPercent({ x: sore.x, y: sore.y });
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={radiusFor(sore.size, 'front')}
            fill={`hsl(var(--sev-${sore.pain}))`}
            fillOpacity="0.85"
            stroke="hsl(var(--foreground) / 0.45)"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}
