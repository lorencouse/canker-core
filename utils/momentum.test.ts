import { describe, expect, it } from 'vitest';

import type { DayLog, Reading, Sore } from '@/types';
import {
  BAD_DAY_PAIN,
  isBadDay,
  streakHeadline,
  todayMood,
  triggerFreeStreak,
  weekDots
} from './momentum';

// Local-time constructors so the tests hold in any timezone.
const now = new Date(2026, 10, 5, 14, 0, 0);
const today = '2026-11-05';

const log = (day: string, triggers: string[] = []): DayLog => ({
  day,
  triggers,
  treatments: [],
  note: null
});

const reading = (overrides: Partial<Reading> = {}): Reading => ({
  id: 'r',
  recorded_at: new Date(2026, 10, 5, 9, 0, 0).toISOString(),
  size: 3,
  pain: 3,
  note: null,
  ...overrides
});

const sore = (overrides: Partial<Sore> = {}): Sore => ({
  id: 'a',
  user_id: 'u',
  view: 'front',
  x: 50,
  y: 50,
  zone: 'Tongue',
  created_at: new Date(2026, 10, 1, 9, 0, 0).toISOString(),
  healed_at: null,
  readings: [reading({ recorded_at: new Date(2026, 10, 1, 9, 0, 0).toISOString() })],
  ...overrides
});

describe('triggerFreeStreak', () => {
  it('counts consecutive trigger-free logged days', () => {
    const logs = [log('2026-11-03'), log('2026-11-04'), log('2026-11-05')];
    expect(triggerFreeStreak(logs, today)).toBe(3);
  });

  it("keeps yesterday's streak before today is logged", () => {
    const logs = [log('2026-11-03'), log('2026-11-04')];
    expect(triggerFreeStreak(logs, today)).toBe(2);
  });

  it('a trigger ends the streak', () => {
    const logs = [log('2026-11-03'), log('2026-11-04', ['Citrus']), log('2026-11-05')];
    expect(triggerFreeStreak(logs, today)).toBe(1);
  });

  it('a missing day ends the streak', () => {
    const logs = [log('2026-11-02'), log('2026-11-05')];
    expect(triggerFreeStreak(logs, today)).toBe(1);
  });

  it('crosses a month boundary', () => {
    const logs = [log('2026-10-30'), log('2026-10-31'), log('2026-11-01')];
    expect(triggerFreeStreak(logs, '2026-11-01')).toBe(3);
  });

  it('zero streak is neutral', () => {
    expect(triggerFreeStreak([], today)).toBe(0);
    expect(todayMood([], [], now)).toBe('neutral');
  });
});

describe('isBadDay', () => {
  it('treats pain at the threshold as a bad day', () => {
    expect(BAD_DAY_PAIN).toBe(6);
    expect(isBadDay([sore({ readings: [reading({ pain: 6 })] })], now)).toBe(true);
    expect(isBadDay([sore({ readings: [reading({ pain: 5 })] })], now)).toBe(false);
  });

  it('ignores high pain recorded on another day', () => {
    const yesterday = new Date(2026, 10, 4, 9, 0, 0).toISOString();
    expect(
      isBadDay([sore({ readings: [reading({ pain: 9, recorded_at: yesterday })] })], now)
    ).toBe(false);
  });

  it('a sore created today is a bad day regardless of pain', () => {
    const fresh = sore({
      created_at: new Date(2026, 10, 5, 8, 0, 0).toISOString(),
      readings: [reading({ pain: 1 })]
    });
    expect(isBadDay([fresh], now)).toBe(true);
  });
});

describe('todayMood', () => {
  it('a bad day beats a streak', () => {
    const logs = [1, 2, 3, 4, 5].map((d) => log(`2026-11-0${d}`));
    const sores = [sore({ readings: [reading({ pain: 7 })] })];
    expect(todayMood(sores, logs, now)).toBe('gentle');
  });

  it('is proud with a streak and no bad day', () => {
    expect(todayMood([], [log('2026-11-04')], now)).toBe('proud');
  });
});

describe('weekDots', () => {
  it('lists the 7 local days ending today, oldest first', () => {
    const logs = [log('2026-11-03'), log('2026-11-04', ['Citrus']), log('2026-11-05')];
    const dots = weekDots(logs, today);
    expect(dots.map((d) => d.day)).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05'
    ]);
    expect(dots.map((d) => d.won)).toEqual([false, false, false, false, true, false, true]);
    dots.forEach((d) => expect(d.initial).toHaveLength(1));
  });
});

describe('streakHeadline', () => {
  it('uses words then digits', () => {
    expect(streakHeadline(1)).toBe('One day strong.');
    expect(streakHeadline(3)).toBe('Three days strong.');
    expect(streakHeadline(10)).toBe('Ten days strong.');
    expect(streakHeadline(12)).toBe('12 days strong.');
    expect(streakHeadline(120)).toBe('120 days strong.');
  });
});
