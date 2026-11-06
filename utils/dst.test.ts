import { describe, expect, it } from 'vitest';

import type { DayLog, Sore } from '@/types';
import { courseOf } from './course';
import { triggersBeforeSores } from './insights';
import { dayNumberOf } from './readings';

/*
 * Calendar-day arithmetic across daylight saving. These only bite in a zone
 * that observes DST, so run them with `npm run test:dst` (TZ=America/Los_Angeles).
 * Under UTC they pass trivially, which is why the plain suite stays green.
 */

const local = (day: string, hour = 12, minute = 0) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute);
};

const sore = (created: Date, overrides: Partial<Sore> = {}): Sore => ({
  id: 'a',
  user_id: 'u',
  view: 'front',
  x: 50,
  y: 50,
  zone: 'Tongue',
  created_at: created.toISOString(),
  healed_at: null,
  readings: [],
  ...overrides
});

/** Consecutive local dates from `first`, built without millisecond maths. */
const range = (first: string, count: number) => {
  const [y, m, d] = first.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const t = new Date(y, m - 1, d + i, 12);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
  });
};

describe('courseOf across daylight saving', () => {
  it('lists each date once over the fall-back day (2026-11-01)', () => {
    const days = courseOf(sore(local('2026-10-30')), local('2026-11-03'));
    expect(days.map((d) => d.day)).toEqual(range('2026-10-30', 5));
    expect(days.map((d) => d.n)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(days.map((d) => d.day)).size).toBe(days.length);
  });

  it('skips no date over the spring-forward day (2026-03-08)', () => {
    const days = courseOf(sore(local('2026-03-06')), local('2026-03-10'));
    expect(days.map((d) => d.day)).toEqual(range('2026-03-06', 5));
    expect(days.map((d) => d.n)).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps a healed sore ending on its healed date', () => {
    const days = courseOf(
      sore(local('2026-10-30', 23, 30), {
        healed_at: local('2026-11-02', 0, 30).toISOString()
      }),
      local('2026-11-20')
    );
    expect(days.map((d) => d.day)).toEqual(range('2026-10-30', 4));
    expect(days[3].isHealedDay).toBe(true);
  });
});

describe('Day N across daylight saving', () => {
  it('counts calendar days over fall-back', () => {
    expect(
      dayNumberOf(sore(local('2026-10-31', 0, 30)), local('2026-11-02', 23, 30))
    ).toBe(3);
  });
  it('counts calendar days over spring-forward', () => {
    expect(
      dayNumberOf(sore(local('2026-03-07', 0, 30)), local('2026-03-09', 23, 30))
    ).toBe(3);
  });
});

describe('triggersBeforeSores across daylight saving', () => {
  const log = (day: string): DayLog =>
    ({ day, triggers: ['stress'], treatments: [] }) as unknown as DayLog;

  it('finds the previous calendar day after fall-back', () => {
    const r = triggersBeforeSores(
      [sore(local('2026-11-01', 23, 30))],
      [log('2026-10-31')],
      2
    );
    expect(r.soresWithLogs).toBe(1);
  });

  it('finds the previous calendar day after spring-forward', () => {
    const r = triggersBeforeSores(
      [sore(local('2026-03-09', 0, 30))],
      [log('2026-03-08')],
      2
    );
    expect(r.soresWithLogs).toBe(1);
  });
});
