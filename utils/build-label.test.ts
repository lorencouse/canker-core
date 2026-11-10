import { describe, expect, it } from 'vitest';

import { buildLabel } from './build-label.mjs';

const at = new Date('2026-11-09T23:30:00Z');

describe('buildLabel', () => {
  it('joins the UTC date and the short commit', () => {
    expect(buildLabel('0913ad8f00d1', at)).toBe('2026.11.09 · 0913ad8');
  });

  it('falls back to dev without a usable commit', () => {
    expect(buildLabel(undefined, at)).toBe('dev');
    expect(buildLabel('', at)).toBe('dev');
    expect(buildLabel('  \n', at)).toBe('dev');
    expect(buildLabel('not-a-sha', at)).toBe('dev');
  });
});
