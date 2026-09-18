import { describe, expect, it } from 'vitest';

import { MOUTH_VIEWS, ZONE_ANCHORS } from '@/utils/mouth-map/geometry';

import { MOUTH_SITES, SITE_BY_ZONE } from './sites';

/**
 * The guard that matters here is drift in one direction: the geometry decides
 * what zones exist, and if a zone gains a name or loses one, the map ends up
 * with a place you can tap and nothing to say about it.
 */
describe('mouth sites', () => {
  it('describes every zone the map can land a tap in', () => {
    const zones = MOUTH_VIEWS.flatMap((view) =>
      ZONE_ANCHORS[view].map((anchor) => anchor.zone)
    );
    const undescribed = zones.filter((zone) => !SITE_BY_ZONE[zone]);
    expect(undescribed).toEqual([]);
  });

  it('claims no zone the geometry does not produce', () => {
    const zones = new Set(
      MOUTH_VIEWS.flatMap((view) =>
        ZONE_ANCHORS[view].map((anchor) => anchor.zone)
      )
    );
    const invented = MOUTH_SITES.flatMap((site) =>
      site.zones.filter((zone) => !zones.has(zone))
    );
    expect(invented).toEqual([]);
  });

  it('puts each site in the view that actually draws its zones', () => {
    for (const site of MOUTH_SITES) {
      const drawn = ZONE_ANCHORS[site.view].map((anchor) => anchor.zone);
      for (const zone of site.zones) expect(drawn).toContain(zone);
    }
  });
});
