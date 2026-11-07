import { describe, expect, it } from 'vitest';
import type { Sore } from '@/types';
import {
  buildSteps,
  defaultDay,
  nextStepAfter,
  resolveDay,
  shouldAutoStart,
  stepKey
} from './steps';

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

describe('nextStepAfter', () => {
  const steps = buildSteps([sore('A', '2026-11-01T00:00:00Z', null)]);

  it('moves to the following step on next', () => {
    const r = nextStepAfter(steps, 'sore:A', 'next');
    expect(r.current).toBe('new-sore-ask');
    expect(r.steps).toBe(steps);
  });

  it('stays on finish', () => {
    expect(nextStepAfter(steps, 'finish', 'next').current).toBe('finish');
  });

  it('puts an added sore before a fresh ask and lands on it', () => {
    const r = nextStepAfter(steps, 'new-sore-ask', 'added-sore', 'N');
    expect(r.current).toBe('sore:N');
    expect(r.steps.map(stepKey)).toEqual([
      'sore:A', 'sore:N', 'new-sore-ask', 'sleep', 'food', 'health', 'treatments', 'finish'
    ]);
  });

  it('asks again after the added sore', () => {
    const added = nextStepAfter(steps, 'new-sore-ask', 'added-sore', 'N');
    const r = nextStepAfter(added.steps, added.current, 'next');
    expect(r.current).toBe('new-sore-ask');
    expect(nextStepAfter(r.steps, r.current, 'next').current).toBe('sleep');
  });

  it('ignores added-sore without an id or away from the ask', () => {
    expect(nextStepAfter(steps, 'new-sore-ask', 'added-sore')).toEqual({
      steps,
      current: 'new-sore-ask'
    });
    expect(nextStepAfter(steps, 'sleep', 'added-sore', 'N')).toEqual({
      steps,
      current: 'sleep'
    });
  });

  it('leaves an unknown current step where it is', () => {
    expect(nextStepAfter(steps, 'sore:gone', 'next').current).toBe('sore:gone');
  });
});

describe('resolveDay', () => {
  it('is the local day for today', () => {
    expect(resolveDay('today', new Date(2026, 10, 6, 23, 30))).toBe('2026-11-06');
  });
  it('steps back a calendar day for yesterday, across DST', () => {
    expect(resolveDay('yesterday', new Date(2026, 2, 8, 8))).toBe('2026-03-07');
    expect(resolveDay('yesterday', new Date(2026, 10, 2, 0, 30))).toBe('2026-11-01');
  });
});
