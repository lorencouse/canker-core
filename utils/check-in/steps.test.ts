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

const sore = (
  id: string,
  created_at: string,
  healed_at: string | null,
  view = 'front'
) => ({ id, created_at, healed_at, view, readings: [] }) as unknown as Sore;

describe('buildSteps', () => {
  it('puts active sores first, then the fixed screens', () => {
    const steps = buildSteps([
      sore('B', '2026-10-30T00:00:00Z', '2026-11-02T00:00:00Z'),
      sore('A', '2026-11-01T00:00:00Z', null)
    ]);
    expect(steps.map(stepKey)).toEqual([
      'sore:A',
      'new-sore-ask',
      'sleep',
      'food',
      'health',
      'treatments',
      'finish'
    ]);
  });

  it('orders active sores oldest first', () => {
    const steps = buildSteps([
      sore('N', '2026-11-03T00:00:00Z', null),
      sore('O', '2026-11-01T00:00:00Z', null)
    ]);
    expect(steps.slice(0, 2).map(stepKey)).toEqual(['sore:O', 'sore:N']);
  });

  it('groups sores by view, front then cheeks then lips, oldest first within one', () => {
    const steps = buildSteps([
      sore('lips', '2026-10-01T00:00:00Z', null, 'lips'),
      sore('cheekNew', '2026-11-02T00:00:00Z', null, 'cheeks'),
      sore('frontNew', '2026-11-03T00:00:00Z', null, 'front'),
      sore('cheekOld', '2026-10-02T00:00:00Z', null, 'cheeks'),
      sore('frontOld', '2026-10-05T00:00:00Z', null, 'front')
    ]);
    expect(steps.slice(0, 5).map(stepKey)).toEqual([
      'sore:frontOld',
      'sore:frontNew',
      'sore:cheekOld',
      'sore:cheekNew',
      'sore:lips'
    ]);
  });

  it('starts at new-sore-ask with no active sores', () => {
    expect(buildSteps([])[0]).toEqual({ kind: 'new-sore-ask' });
  });
});

describe('defaultDay', () => {
  const at = (h: number) => new Date(2026, 10, 6, h);
  it('is yesterday in the morning and today from midday on', () => {
    expect(defaultDay(at(0))).toBe('yesterday');
    expect(defaultDay(at(8))).toBe('yesterday');
    expect(defaultDay(at(11))).toBe('yesterday');
    expect(defaultDay(at(12))).toBe('today');
    expect(defaultDay(at(19))).toBe('today');
    expect(defaultDay(at(23))).toBe('today');
  });
});

describe('shouldAutoStart', () => {
  it('is false when today has a row', () => {
    expect(
      shouldAutoStart([{ day: '2026-11-06', status: 'skipped' }], '2026-11-06')
    ).toBe(false);
  });
  it('is true when only earlier days have rows', () => {
    expect(
      shouldAutoStart([{ day: '2026-11-05', status: 'done' }], '2026-11-06')
    ).toBe(true);
  });
});

describe('nextStepAfter', () => {
  const steps = buildSteps([sore('A', '2026-11-01T00:00:00Z', null)]);

  it('moves to the following step', () => {
    expect(nextStepAfter(steps, 'sore:A')).toBe('new-sore-ask');
  });

  it('stays on finish', () => {
    expect(nextStepAfter(steps, 'finish')).toBe('finish');
  });

  it('leaves an unknown current step where it is', () => {
    expect(nextStepAfter(steps, 'sore:gone')).toBe('sore:gone');
  });
});

describe('resolveDay', () => {
  it('is the local day for today', () => {
    expect(resolveDay('today', new Date(2026, 10, 6, 23, 30))).toBe(
      '2026-11-06'
    );
  });
  it('steps back a calendar day for yesterday, across DST', () => {
    expect(resolveDay('yesterday', new Date(2026, 2, 8, 8))).toBe('2026-03-07');
    expect(resolveDay('yesterday', new Date(2026, 10, 2, 0, 30))).toBe(
      '2026-11-01'
    );
  });
});
