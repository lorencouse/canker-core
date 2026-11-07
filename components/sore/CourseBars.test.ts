import { describe, expect, it } from 'vitest';
import { barGap } from './CourseBars';

describe('barGap', () => {
  it('keeps gaps for an ordinary fortnight', () => {
    expect(barGap(14)).toBe(3);
  });

  it('drops gaps once a course runs past a month, so they cannot outgrow a phone', () => {
    // A sore open since early 2025: 670 bars with 3px gaps is ~2000px.
    expect(barGap(670)).toBe(0);
    expect(barGap(670) * 669).toBeLessThan(320);
  });
});
