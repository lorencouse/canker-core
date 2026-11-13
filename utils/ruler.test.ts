import { describe, expect, it } from 'vitest';

import {
  WIDTH_MAX,
  WIDTH_MIN,
  clampWidth,
  painMood,
  rulerIndex,
  rulerValue
} from './ruler';

describe('the width ruler', () => {
  it('rounds to the half millimetre and stays in range', () => {
    expect(clampWidth(3.3)).toBe(3.5);
    expect(clampWidth(0)).toBe(WIDTH_MIN);
    expect(clampWidth(99)).toBe(WIDTH_MAX);
  });

  it('maps every width to a tick and back', () => {
    for (let mm = WIDTH_MIN; mm <= WIDTH_MAX; mm += 0.5) {
      expect(rulerValue(rulerIndex(mm))).toBe(mm);
    }
    expect(rulerIndex(WIDTH_MIN)).toBe(0);
    expect(rulerIndex(WIDTH_MAX)).toBe(39);
  });

  it('reads a scroll past either end as that end', () => {
    expect(rulerValue(-3)).toBe(WIDTH_MIN);
    expect(rulerValue(500)).toBe(WIDTH_MAX);
  });
});

describe('Kanko over the pain slider', () => {
  it('is calm to 3, uneasy to 6 and ouch from 7', () => {
    expect(painMood(1)).toBe('pain-calm');
    expect(painMood(3)).toBe('pain-calm');
    expect(painMood(4)).toBe('pain-uneasy');
    expect(painMood(6)).toBe('pain-uneasy');
    expect(painMood(7)).toBe('pain-ouch');
    expect(painMood(10)).toBe('pain-ouch');
  });
});
