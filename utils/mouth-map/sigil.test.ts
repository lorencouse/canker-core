import { describe, expect, it } from 'vitest';

import { MOUTH_VIEWS, VIEW_BOX, ZONE_ANCHORS, fromPercent } from './geometry';
import { sigilCovers, sigilShapes } from './sigil';

/**
 * The sigil's one promise is that its dot always lands on its glyph. The dot
 * is placed from a sore's stored coordinates, which can be anywhere the map
 * accepts a tap, so the silhouette has to cover every plottable point of the
 * view. Zone anchors are points the geometry itself vouches for, which makes
 * them the right sample: if the artwork moves, they move, and this fails.
 */
describe('sigilCovers', () => {
  it.each(MOUTH_VIEWS)('covers every zone anchor of the %s view', (view) => {
    const missed = ZONE_ANCHORS[view]
      .filter(({ point }) => !sigilCovers(view, point))
      .map(({ zone }) => zone);
    expect(missed).toEqual([]);
  });

  it('stays off the corners of the drawing box', () => {
    // A silhouette that swallowed the whole viewBox would satisfy the test
    // above while drawing a meaningless blob, so pin the other side too:
    // the corners are off the tissue and must stay off the glyph.
    const corners = [
      { x: 2, y: 2 },
      { x: VIEW_BOX.width - 2, y: 2 },
      { x: 2, y: VIEW_BOX.height - 2 },
      { x: VIEW_BOX.width - 2, y: VIEW_BOX.height - 2 }
    ];
    for (const view of MOUTH_VIEWS)
      for (const corner of corners) expect(sigilCovers(view, corner)).toBe(false);
  });

  it('covers the coordinates already stored in the database', () => {
    const stored = [
      { x: 42.3, y: 74.0 },
      { x: 71.6, y: 45.8 },
      { x: 31.5, y: 30.5 },
      { x: 65.4, y: 27.0 }
    ];
    for (const pct of stored) expect(sigilCovers('front', fromPercent(pct))).toBe(true);
  });
});

describe('sigilShapes', () => {
  it('gives one shape for the front view and two for the paired ones', () => {
    expect(sigilShapes('front')).toHaveLength(1);
    expect(sigilShapes('cheeks')).toHaveLength(2);
    expect(sigilShapes('lips')).toHaveLength(2);
  });
});
