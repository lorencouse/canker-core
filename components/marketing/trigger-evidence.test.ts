import { describe, expect, it } from 'vitest';

import { triggerEvidence } from './trigger-evidence';

describe('triggerEvidence', () => {
  it('needs five sores before it will call anything', () => {
    const { verdict } = triggerEvidence({
      sores: 4,
      hits: 4,
      triggerDaysPerWeek: 1
    });
    expect(verdict).toBe('too-few');
  });

  it('computes the base rate over the three-day window', () => {
    // One stressful day in seven: 1 - (6/7)^3.
    const { expected } = triggerEvidence({
      sores: 10,
      hits: 5,
      triggerDaysPerWeek: 1
    });
    expect(expected).toBeCloseTo(0.37, 2);
  });

  it('calls a tally that clears the base rate', () => {
    const { verdict } = triggerEvidence({
      sores: 10,
      hits: 9,
      triggerDaysPerWeek: 1
    });
    expect(verdict).toBe('above');
  });

  it('does not call a tally the base rate already explains', () => {
    // Three stressful days a week puts the baseline near 78%, so 8 of 10 is
    // exactly what no association looks like.
    const { verdict } = triggerEvidence({
      sores: 10,
      hits: 8,
      triggerDaysPerWeek: 3
    });
    expect(verdict).toBe('at-or-below');
  });

  it('refuses the question when nearly every day qualifies', () => {
    const { verdict } = triggerEvidence({
      sores: 10,
      hits: 10,
      triggerDaysPerWeek: 6
    });
    expect(verdict).toBe('saturated');
  });

  it('never reports more hits than sores', () => {
    const { observed } = triggerEvidence({
      sores: 5,
      hits: 9,
      triggerDaysPerWeek: 2
    });
    expect(observed).toBe(1);
  });
});
