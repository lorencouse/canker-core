import { describe, expect, it } from 'vitest';

import {
  CHEEKS,
  FRONT,
  LIPS,
  MIN_RADIUS,
  fromPercent,
  isMouthView,
  radiusFor,
  toPercent,
  zoneAt,
  zoneFor
} from './geometry';

describe('coordinate conversion', () => {
  it('round-trips through percentages', () => {
    const p = { x: 123.4, y: 56.7 };
    const back = fromPercent(toPercent(p));
    expect(back.x).toBeCloseTo(p.x);
    expect(back.y).toBeCloseTo(p.y);
  });
});

describe('radiusFor', () => {
  it('never shrinks below the tappable minimum', () => {
    expect(radiusFor(0.5, 'front')).toBe(MIN_RADIUS);
  });

  it('scales with the view magnification', () => {
    expect(radiusFor(4, 'front')).toBeGreaterThan(radiusFor(4, 'cheeks'));
  });
});

describe('zoneAt', () => {
  it('finds the tongue in the middle of the front view', () => {
    const t = FRONT.tongue;
    expect(zoneAt('front', { x: FRONT.cx, y: (t.top + t.bottom) / 2 })).toBe('Tongue');
  });

  it('finds the roof of the mouth above the upper arch', () => {
    expect(zoneAt('front', { x: FRONT.cx, y: FRONT.uy - FRONT.ury * 0.5 })).toBe('Roof of mouth');
  });

  it('returns null off the tissue', () => {
    expect(zoneAt('front', { x: 1, y: 1 })).toBeNull();
    expect(zoneAt('cheeks', { x: 195, y: 200 })).toBeNull();
    expect(zoneAt('lips', { x: 195, y: 210 })).toBeNull();
  });

  it('tells left cheek from right cheek', () => {
    const { left, right } = CHEEKS;
    expect(zoneAt('cheeks', { x: left.x + left.w / 2, y: left.y + left.h / 2 })).toBe('Left cheek');
    expect(zoneAt('cheeks', { x: right.x + right.w / 2, y: right.y + right.h / 2 })).toBe('Right cheek');
  });

  it('tells upper lip from lower lip', () => {
    const { upper, lower } = LIPS;
    expect(zoneAt('lips', { x: upper.cx, y: upper.y + upper.h * 0.6 })).toBe('Upper lip');
    expect(zoneAt('lips', { x: lower.cx, y: lower.y + lower.h * 0.45 })).toBe('Lower lip');
  });
});

describe('zoneFor', () => {
  it('falls back to a generic label for a stored point off the tissue', () => {
    expect(zoneFor('front', 0, 0)).toBe('Mouth');
  });
});

describe('isMouthView', () => {
  it('accepts only the three views', () => {
    expect(isMouthView('front')).toBe(true);
    expect(isMouthView('gums')).toBe(false);
    expect(isMouthView(null)).toBe(false);
  });
});
