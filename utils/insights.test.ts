import { describe, expect, it } from 'vitest';

import type { DayLog, Sore } from '@/types';
import { emptyDayLog } from '@/utils/day-log';
import {
  isLongRunning,
  medianDaysToHeal,
  mostCommonZone,
  soreDays,
  strongestPattern,
  treatmentDays,
  triggersBeforeSores,
  worstPainSince
} from './insights';

const sore = (overrides: Partial<Sore>): Sore => ({
  id: Math.random().toString(36).slice(2),
  user_id: 'u',
  view: 'front',
  x: 50,
  y: 50,
  zone: 'Tongue',
  created_at: '2026-09-01T12:00:00.000Z',
  healed_at: null,
  readings: [],
  ...overrides
});

const log = (day: string, triggers: string[] = [], treatments: string[] = []): DayLog => ({
  ...emptyDayLog(day),
  triggers,
  treatments
});

describe('medianDaysToHeal', () => {
  it('uses healed sores only and takes the median', () => {
    const sores = [
      sore({ created_at: '2026-09-01T12:00:00Z', healed_at: '2026-09-05T12:00:00Z' }), // 5
      sore({ created_at: '2026-09-01T12:00:00Z', healed_at: '2026-09-11T12:00:00Z' }), // 11
      sore({ created_at: '2026-09-01T12:00:00Z', healed_at: '2026-09-07T12:00:00Z' }), // 7
      sore({ created_at: '2026-09-01T12:00:00Z' })
    ];
    expect(medianDaysToHeal(sores)).toBe(7);
    expect(medianDaysToHeal([sore({})])).toBeNull();
  });
});

describe('worstPainSince', () => {
  it('ignores readings before the cutoff', () => {
    const s = sore({
      readings: [
        { id: '1', recorded_at: '2026-08-01T00:00:00Z', size: 3, pain: 9, note: null },
        { id: '2', recorded_at: '2026-09-02T00:00:00Z', size: 3, pain: 5, note: null }
      ]
    });
    expect(worstPainSince([s], new Date('2026-09-01T00:00:00Z'))).toBe(5);
    expect(worstPainSince([s], new Date('2026-10-01T00:00:00Z'))).toBeNull();
  });
});

describe('mostCommonZone', () => {
  it('counts sores per zone', () => {
    const sores = [sore({ zone: 'Tongue' }), sore({ zone: 'Left cheek' }), sore({ zone: 'Left cheek' })];
    expect(mostCommonZone(sores)).toEqual({ zone: 'Left cheek', count: 2 });
    expect(mostCommonZone([])).toBeNull();
  });
});

describe('isLongRunning', () => {
  it('flags open sores past two weeks and never healed ones', () => {
    const now = new Date('2026-09-20T12:00:00Z');
    expect(isLongRunning(sore({ created_at: '2026-09-01T12:00:00Z' }), now)).toBe(true);
    expect(isLongRunning(sore({ created_at: '2026-09-10T12:00:00Z' }), now)).toBe(false);
    expect(
      isLongRunning(sore({ created_at: '2026-08-01T12:00:00Z', healed_at: '2026-09-01T00:00:00Z' }), now)
    ).toBe(false);
  });
});

describe('triggersBeforeSores', () => {
  it('counts each trigger once per sore across the run-up window', () => {
    const sores = [
      sore({ created_at: '2026-09-10T12:00:00' }),
      sore({ created_at: '2026-09-20T12:00:00' }),
      sore({ created_at: '2026-09-25T12:00:00' })
    ];
    const logs = [
      log('2026-09-09', ['Stress', 'Coffee']),
      log('2026-09-10', ['Stress']),
      log('2026-09-18', ['Stress']),
      log('2026-09-30', ['Nuts'])
    ];
    const answered = logs.map((l) => ({ ...l, food_answered: true, health_answered: true }));
    const { tally, soresWithLogs } = triggersBeforeSores(sores, answered, 3);
    expect(soresWithLogs).toBe(2);
    expect(tally).toEqual([
      { label: 'Stress', count: 2 },
      { label: 'Coffee', count: 1 }
    ]);
  });
});

describe('triggersBeforeSores (partial rows)', () => {
  it('counts a sore as logged only when its window has an answered row', () => {
    const sores = [
      sore({ created_at: '2026-09-10T12:00:00' }),
      sore({ created_at: '2026-09-20T12:00:00' }),
      sore({ created_at: '2026-09-25T12:00:00' })
    ];
    const logs = [
      // Sleep or treatments only: one question, or neither, answered.
      { ...log('2026-09-10'), sleep_hours: 7 },
      { ...log('2026-09-19'), food_answered: true },
      { ...log('2026-09-25'), food_answered: true, health_answered: true }
    ];
    expect(triggersBeforeSores(sores, logs, 3).soresWithLogs).toBe(1);
  });
});

describe('triggersBeforeSores (derived)', () => {
  it('tallies a derived Stress from a stress of 5', () => {
    const sores = [sore({ created_at: '2026-09-10T12:00:00' })];
    const logs = [{ ...log('2026-09-10'), stress: 5 }];
    expect(triggersBeforeSores(sores, logs, 3).tally).toEqual([
      { label: 'Stress', count: 1 }
    ]);
  });
});

describe('treatmentDays', () => {
  it('counts days per treatment, most used first', () => {
    const logs = [log('2026-09-01', [], ['Salt-water rinse']), log('2026-09-02', [], ['Salt-water rinse', 'Numbing gel'])];
    expect(treatmentDays(logs)).toEqual([
      { label: 'Salt-water rinse', count: 2 },
      { label: 'Numbing gel', count: 1 }
    ]);
  });
});

describe('strongestPattern', () => {
  // Sores first marked at local noon on the given days.
  const at = (day: string) => sore({ created_at: new Date(`${day}T12:00:00`).toISOString() });

  it('names the trigger logged before the most sores', () => {
    const sores = [at('2026-09-03'), at('2026-09-13'), at('2026-09-23')];
    const logs = [
      log('2026-09-02', ['Stress', 'Coffee']),
      log('2026-09-12', ['Stress']),
      log('2026-09-22', ['Spicy food'])
    ];
    expect(strongestPattern(sores, logs)).toEqual({
      kind: 'pattern',
      trigger: 'Stress',
      count: 2,
      of: 3
    });
  });

  it('says so when nothing was logged before any sore', () => {
    expect(strongestPattern([at('2026-09-03')], [log('2026-08-01', ['Stress'])])).toEqual({
      kind: 'none',
      reason: 'no-logs'
    });
  });

  it('does not call a single sore a pattern', () => {
    const sores = [at('2026-09-03'), at('2026-09-13')];
    const logs = [log('2026-09-02', ['Stress']), log('2026-09-12', ['Coffee'])];
    expect(strongestPattern(sores, logs)).toEqual({ kind: 'none', reason: 'no-repeat' });
  });

  it('needs the trigger before at least half the sores with logs', () => {
    const days = ['01', '05', '09', '13', '17'].map((d) => `2026-09-${d}`);
    const sores = days.map(at);
    const clean = (day: string): DayLog => ({
      ...emptyDayLog(day),
      food_answered: true,
      health_answered: true
    });
    // Stress before 2 of 5 sores with logs: a repeat, but not half.
    const logs = days.map((d, i) => (i < 2 ? log(d, ['Stress']) : clean(d)));
    expect(strongestPattern(sores, logs)).toEqual({ kind: 'none', reason: 'no-repeat' });
    // Before 2 of 4, it is.
    expect(strongestPattern(sores.slice(0, 4), logs)).toMatchObject({ trigger: 'Stress', of: 4 });
  });

  it('never counts a trigger for more sores than have logs', () => {
    // A check-in that only set stress: not "answered", but it carries a trigger.
    const stressed = (day: string): DayLog => ({ ...emptyDayLog(day), stress: 5 });
    const sores = [at('2026-09-03'), at('2026-09-13')];
    const finding = strongestPattern(sores, [stressed('2026-09-03'), stressed('2026-09-13')]);
    expect(finding).toEqual({ kind: 'pattern', trigger: 'Stress', count: 2, of: 2 });
  });
});

describe('soreDays', () => {
  it('keeps the largest sore and the worst pain per day, from the cutoff on', () => {
    const r = (id: string, day: string, size: number, pain: number) => ({
      id,
      recorded_at: new Date(`${day}T10:00:00`).toISOString(),
      size,
      pain,
      note: null
    });
    const a = sore({ id: 'a', zone: 'Tongue', readings: [r('1', '2026-09-01', 2, 3), r('2', '2026-09-02', 3, 2)] });
    const b = sore({ id: 'b', zone: 'Lip', readings: [r('3', '2026-09-02', 1, 7)] });
    const days = soreDays([a, b], null);
    expect(days.map((d) => [d.day, d.size, d.pain])).toEqual([
      ['2026-09-01', 2, 3],
      ['2026-09-02', 3, 7]
    ]);
    expect(days[1].sores.map((s) => s.id)).toEqual(['a', 'b']);
    expect(soreDays([a, b], new Date('2026-09-02T00:00:00')).map((d) => d.day)).toEqual(['2026-09-02']);
  });
});
