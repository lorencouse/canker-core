import { describe, expect, it } from 'vitest';
import type { Sore } from '@/types';
import { buildSteps, defaultDay, shouldAutoStart, stepKey } from './steps';

const sore = (id: string, created_at: string, healed_at: string | null) =>
  ({ id, created_at, healed_at, readings: [] }) as unknown as Sore;

describe('buildSteps', () => {
  it('puts active sores first, then the fixed screens', () => {
    const steps = buildSteps([
      sore('B', '2026-10-30T00:00:00Z', '2026-11-02T00:00:00Z'),
      sore('A', '2026-11-01T00:00:00Z', null)
    ]);
    expect(steps.map(stepKey)).toEqual([
      'sore:A', 'new-sore-ask', 'sleep', 'food', 'health', 'treatments', 'finish'
    ]);
  });

  it('orders active sores oldest first', () => {
    const steps = buildSteps([
      sore('N', '2026-11-03T00:00:00Z', null),
      sore('O', '2026-11-01T00:00:00Z', null)
    ]);
    expect(steps.slice(0, 2).map(stepKey)).toEqual(['sore:O', 'sore:N']);
  });

  it('starts at new-sore-ask with no active sores', () => {
    expect(buildSteps([])[0]).toEqual({ kind: 'new-sore-ask' });
  });
});

describe('defaultDay', () => {
  const at = (h: number) => new Date(2026, 10, 6, h);
  it('maps kinds to days', () => {
    expect(defaultDay('food', at(8), false)).toBe('yesterday');
    expect(defaultDay('health', at(8), false)).toBe('yesterday');
    expect(defaultDay('sleep', at(8), false)).toBe('today');
    expect(defaultDay('treatments', at(8), false)).toBe('today');
  });
  it('uses today for everything when manual from midday', () => {
    expect(defaultDay('food', at(15), true)).toBe('today');
    expect(defaultDay('food', at(12), true)).toBe('today');
    expect(defaultDay('food', at(11), true)).toBe('yesterday');
    expect(defaultDay('food', at(15), false)).toBe('yesterday');
  });
});

describe('shouldAutoStart', () => {
  it('is false when today has a row', () => {
    expect(shouldAutoStart([{ day: '2026-11-06', status: 'skipped' }], '2026-11-06')).toBe(false);
  });
  it('is true when only earlier days have rows', () => {
    expect(shouldAutoStart([{ day: '2026-11-05', status: 'done' }], '2026-11-06')).toBe(true);
  });
});
