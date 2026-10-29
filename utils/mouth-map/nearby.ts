import type { Sore } from '@/types';
import { fromPercent, UNITS_PER_MM } from '@/utils/mouth-map/geometry';

/** How close counts as "the same spot", in millimetres of mouth. */
export const NEARBY_MM = 5;

/**
 * Earlier sores within a few millimetres of this one, on the same view,
 * newest first.
 *
 * Place against time is the map's own idea: a sore that keeps returning to
 * one point usually has a local cause (a sharp tooth, a brace, a habit),
 * where sores scattered across the mouth point at something systemic.
 */
export function nearbySores(
  sore: Sore,
  all: Sore[],
  radiusMm = NEARBY_MM
): Sore[] {
  if (sore.x === null || sore.y === null) return [];
  const here = fromPercent({ x: sore.x, y: sore.y });
  const reach = radiusMm * UNITS_PER_MM[sore.view];
  const created = new Date(sore.created_at).getTime();

  return all
    .filter((other) => {
      if (other.id === sore.id || other.view !== sore.view) return false;
      if (other.x === null || other.y === null) return false;
      if (new Date(other.created_at).getTime() >= created) return false;
      const there = fromPercent({ x: other.x, y: other.y });
      return Math.hypot(there.x - here.x, there.y - here.y) <= reach;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}
