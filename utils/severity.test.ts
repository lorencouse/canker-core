import { describe, expect, it } from 'vitest';

import { sevFill } from './severity';

describe('sevFill', () => {
  it('names the variable for a level on the scale', () => {
    expect(sevFill(1)).toBe('hsl(var(--sev-1))');
    expect(sevFill(10)).toBe('hsl(var(--sev-10))');
  });

  it('rounds a fractional level, which has no variable of its own', () => {
    expect(sevFill(3.4)).toBe('hsl(var(--sev-3))');
  });

  it('clamps a level off the scale', () => {
    expect(sevFill(0)).toBe('hsl(var(--sev-1))');
    expect(sevFill(14)).toBe('hsl(var(--sev-10))');
  });
});
