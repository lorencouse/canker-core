import { describe, expect, it } from 'vitest';

import type { DayLog, Sore } from '@/types';
import {
  isLongRunning,
  medianDaysToHeal,
  mostCommonZone,
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
  day,
  triggers,
  treatments,
  note: null
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
    const { tally, soresWithLogs } = triggersBeforeSores(sores, logs, 3);
    expect(soresWithLogs).toBe(2);
    expect(tally).toEqual([
      { label: 'Stress', count: 2 },
      { label: 'Coffee', count: 1 }
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
