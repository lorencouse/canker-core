import { describe, expect, it } from 'vitest';

import type { DayLog, Reading, Sore } from '@/types';
import {
  BAD_DAY_PAIN,
  expectedMood,
  isBadDay,
  streakCardLabel,
  streakHeadline,
  todayMood,
  triggerFreeStreak,
  weekDots,
  withSavedLog
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
  readings: [
    reading({ recorded_at: new Date(2026, 10, 1, 9, 0, 0).toISOString() })
  ],
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
    const logs = [
      log('2026-11-03'),
      log('2026-11-04', ['Citrus']),
      log('2026-11-05')
    ];
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
    expect(isBadDay([sore({ readings: [reading({ pain: 6 })] })], now)).toBe(
      true
    );
    expect(isBadDay([sore({ readings: [reading({ pain: 5 })] })], now)).toBe(
      false
    );
  });

  it('ignores high pain recorded on another day', () => {
    const yesterday = new Date(2026, 10, 4, 9, 0, 0).toISOString();
    expect(
      isBadDay(
        [sore({ readings: [reading({ pain: 9, recorded_at: yesterday })] })],
        now
      )
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
    const logs = [
      log('2026-11-03'),
      log('2026-11-04', ['Citrus']),
      log('2026-11-05')
    ];
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
    expect(dots.map((d) => d.won)).toEqual([
      false,
      false,
      false,
      false,
      true,
      false,
      true
    ]);
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

describe('streakCardLabel', () => {
  it('is singular for a one-day streak', () => {
    expect(streakCardLabel(1)).toBe('trigger-free day');
    expect(streakCardLabel(2)).toBe('trigger-free days');
    expect(streakCardLabel(14)).toBe('trigger-free days');
  });
});

describe('withSavedLog', () => {
  it('records the day log only when Save wrote it', () => {
    const before = [log('2026-11-04')];
    const todays = log('2026-11-05');
    expect(withSavedLog(before, todays, false)).toBe(before);
    expect(withSavedLog(before, todays, true)).toEqual([...before, todays]);
  });

  it('replaces an earlier copy of the same day', () => {
    const first = log('2026-11-05', ['coffee']);
    const second = log('2026-11-05');
    expect(withSavedLog([first], second, true)).toEqual([second]);
  });
});

describe('expectedMood', () => {
  // The server's clock, in UTC; the result must not depend on the host zone.
  const server = new Date(Date.UTC(2026, 10, 5, 12, 0, 0));

  it('is proud when a recent trigger-free day is logged', () => {
    expect(expectedMood([sore()], [log('2026-11-04')], server)).toBe('proud');
  });

  it('allows for a device a day ahead or behind the server', () => {
    expect(expectedMood([sore()], [log('2026-11-06')], server)).toBe('proud');
    expect(expectedMood([sore()], [log('2026-11-03')], server)).toBe('neutral');
  });

  it('is neutral when the last log is too old or had triggers', () => {
    expect(expectedMood([sore()], [log('2026-11-01')], server)).toBe('neutral');
    expect(
      expectedMood([sore()], [log('2026-11-04', ['coffee'])], server)
    ).toBe('neutral');
  });

  it('is gentle for a sore placed or a bad reading around now', () => {
    const fresh = sore({ created_at: '2026-11-05T08:00:00.000Z' });
    expect(expectedMood([fresh], [log('2026-11-04')], server)).toBe('gentle');
    const sharp = sore({
      readings: [
        reading({ recorded_at: '2026-11-05T10:00:00.000Z', pain: BAD_DAY_PAIN })
      ]
    });
    expect(expectedMood([sharp], [], server)).toBe('gentle');
  });

  it('ignores a sore placed too long ago to be on the device today', () => {
    const older = sore({ created_at: '2026-11-04T01:00:00.000Z' });
    expect(expectedMood([older], [log('2026-11-04')], server)).toBe('proud');
  });

  it('is neutral when the newest log in range had triggers', () => {
    const logs = [log('2026-11-04'), log('2026-11-05', ['coffee'])];
    expect(expectedMood([sore()], logs, server)).toBe('neutral');
  });

  describe('with the device zone', () => {
    it('is proud when a sore was placed yesterday evening on the device', () => {
      // 20:00 in Los Angeles on Nov 4, seen at 10:00 there on Nov 5.
      const lastNight = sore({ created_at: '2026-11-05T04:00:00.000Z' });
      const morning = new Date('2026-11-05T18:00:00.000Z');
      const logs = [log('2026-11-04')];
      expect(expectedMood([lastNight], logs, morning)).toBe('gentle');
      expect(
        expectedMood([lastNight], logs, morning, 'America/Los_Angeles')
      ).toBe('proud');
    });

    it('is gentle for a sore placed earlier on the device day', () => {
      const fresh = sore({ created_at: '2026-11-05T16:00:00.000Z' });
      const morning = new Date('2026-11-05T18:00:00.000Z');
      expect(
        expectedMood(
          [fresh],
          [log('2026-11-04')],
          morning,
          'America/Los_Angeles'
        )
      ).toBe('gentle');
    });

    it('counts the streak from the device day', () => {
      // 00:30 on Nov 6 in Kolkata, still Nov 5 on the server.
      const justAfterMidnight = new Date('2026-11-05T19:00:00.000Z');
      const logs = [log('2026-11-03')];
      expect(
        expectedMood([sore()], logs, justAfterMidnight, 'Asia/Kolkata')
      ).toBe('neutral');
      expect(
        expectedMood(
          [sore()],
          [log('2026-11-05')],
          justAfterMidnight,
          'Asia/Kolkata'
        )
      ).toBe('proud');
    });

    it('falls back to the guess for a zone that is not real', () => {
      const lastNight = sore({ created_at: '2026-11-05T04:00:00.000Z' });
      const morning = new Date('2026-11-05T18:00:00.000Z');
      expect(
        expectedMood([lastNight], [log('2026-11-04')], morning, 'Mars/Olympus')
      ).toBe('gentle');
      expect(expectedMood([lastNight], [log('2026-11-04')], morning, '')).toBe(
        'gentle'
      );
    });
  });
});
