import { describe, expect, it } from 'vitest';

import { buildCommit, buildLabel } from './build-label.mjs';

describe('buildLabel', () => {
  it('numbers the version by commit count', () => {
    expect(buildLabel('234')).toBe('v1.234');
    expect(buildLabel(' 31\n')).toBe('v1.31');
    expect(buildLabel(1)).toBe('v1.1');
  });

  it('falls back to dev without a usable count', () => {
    expect(buildLabel(undefined)).toBe('dev');
    expect(buildLabel('')).toBe('dev');
    expect(buildLabel('0')).toBe('dev');
    expect(buildLabel('abc')).toBe('dev');
  });
});

describe('buildCommit', () => {
  it('keeps the short commit', () => {
    expect(buildCommit('0913AD8f00d1\n')).toBe('0913ad8');
  });

  it('is empty without a usable commit', () => {
    expect(buildCommit(undefined)).toBe('');
    expect(buildCommit('not-a-sha')).toBe('');
  });
});
