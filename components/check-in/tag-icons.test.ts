import { describe, expect, it } from 'vitest';

import { FOOD_TRIGGERS, HEALTH_TRIGGERS, TREATMENTS } from '@/utils/day-log';

import { TAG_ICONS, tagIcon } from './tag-icons';

describe('check-in chip icons', () => {
  it('decides every option on every chip screen', () => {
    for (const option of [
      ...FOOD_TRIGGERS,
      ...HEALTH_TRIGGERS,
      ...TREATMENTS
    ]) {
      expect(option in TAG_ICONS).toBe(true);
    }
  });

  it('gives no icon to an unknown or iconless option', () => {
    expect(tagIcon('Bit my cheek or lip')).toBeUndefined();
    expect(tagIcon('Something new')).toBeUndefined();
    expect(tagIcon('Coffee')).toBeDefined();
  });

  it("gives Acidic food a glyph of its own, not Period's droplet", () => {
    expect(tagIcon('Acidic food')).toBeDefined();
    expect(tagIcon('Acidic food')).not.toBe(tagIcon('Period'));
  });
});
