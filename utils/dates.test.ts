import { describe, expect, it } from 'vitest';

import { shortDate } from './dates';

describe('shortDate', () => {
  const now = new Date(2026, 9, 28);

  it('names the month and leaves the year off within this year', () => {
    const text = shortDate(new Date(2026, 9, 22), now);
    expect(text).toMatch(/Oct/);
    expect(text).toMatch(/22/);
    expect(text).not.toMatch(/2026/);
    expect(text).not.toMatch(/\//);
  });

  it('adds the year for another year', () => {
    expect(shortDate(new Date(2025, 6, 8), now)).toMatch(/2025/);
  });
});
