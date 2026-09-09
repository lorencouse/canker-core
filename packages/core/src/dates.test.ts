import type { DateKey } from './dates';
import {
  addDays,
  compareDateKeys,
  daysBetween,
  eachDay,
  formatLong,
  formatShort,
  formatWeekday,
  fromDateKey,
  isDateKey,
  maxDateKey,
  minDateKey,
  toDateKey,
  todayKey
} from './dates';

describe('isDateKey', () => {
  it('accepts a zero-padded YYYY-MM-DD string', () => {
    expect(isDateKey('2026-09-09')).toBe(true);
    expect(isDateKey('0001-01-01')).toBe(true);
  });

  it('rejects unpadded, malformed or non-string values', () => {
    expect(isDateKey('2026-9-9')).toBe(false);
    expect(isDateKey('2026-09-09T00:00:00Z')).toBe(false);
    expect(isDateKey('26-09-09')).toBe(false);
    expect(isDateKey('')).toBe(false);
    expect(isDateKey(20260909)).toBe(false);
    expect(isDateKey(null)).toBe(false);
    expect(isDateKey(undefined)).toBe(false);
    expect(isDateKey(new Date())).toBe(false);
  });
});

describe('todayKey', () => {
  // 00:30 UTC on the 9th: still the 8th in Los Angeles, already the 9th in Tokyo.
  const justAfterUtcMidnight = new Date('2026-09-09T00:30:00Z');
  // 23:00 UTC on the 8th: still the 8th in Los Angeles and UTC, the 9th in Tokyo.
  const justBeforeUtcMidnight = new Date('2026-09-08T23:00:00Z');

  it('reads the calendar date in the given timezone', () => {
    expect(todayKey('UTC', justAfterUtcMidnight)).toBe('2026-09-09');
    expect(todayKey('America/Los_Angeles', justAfterUtcMidnight)).toBe('2026-09-08');
    expect(todayKey('Asia/Tokyo', justAfterUtcMidnight)).toBe('2026-09-09');
  });

  it('gives different days for different zones at the same instant', () => {
    expect(todayKey('UTC', justBeforeUtcMidnight)).toBe('2026-09-08');
    expect(todayKey('America/Los_Angeles', justBeforeUtcMidnight)).toBe('2026-09-08');
    expect(todayKey('Asia/Tokyo', justBeforeUtcMidnight)).toBe('2026-09-09');
  });

  it('always returns a well-formed key', () => {
    expect(isDateKey(todayKey('Asia/Tokyo', justAfterUtcMidnight))).toBe(true);
  });

  it('falls back to the local date instead of throwing on an unknown timezone', () => {
    const now = new Date('2026-09-09T12:00:00Z');
    expect(() => todayKey('Mars/Olympus_Mons', now)).not.toThrow();
    expect(todayKey('Mars/Olympus_Mons', now)).toBe(toDateKey(now));
    expect(todayKey('', now)).toBe(toDateKey(now));
  });
});

describe('toDateKey', () => {
  it('formats the local calendar date with zero padding', () => {
    expect(toDateKey(new Date(2026, 8, 9, 13, 45))).toBe('2026-09-09');
    expect(toDateKey(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
    expect(toDateKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });
});

describe('fromDateKey', () => {
  it('parses to UTC midnight', () => {
    const d = fromDateKey('2026-09-09');
    expect(d.toISOString()).toBe('2026-09-09T00:00:00.000Z');
    expect(d.getTime()).toBe(Date.UTC(2026, 8, 9));
  });

  it('parses the leap day of a leap year exactly', () => {
    expect(fromDateKey('2024-02-29').toISOString()).toBe('2024-02-29T00:00:00.000Z');
  });
});

describe('addDays', () => {
  it('moves forward and backward', () => {
    expect(addDays('2026-09-09', 1)).toBe('2026-09-10');
    expect(addDays('2026-09-09', 0)).toBe('2026-09-09');
    expect(addDays('2026-09-09', -1)).toBe('2026-09-08');
    expect(addDays('2026-09-09', 30)).toBe('2026-10-09');
  });

  it('crosses month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('crosses year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('handles leap and non-leap February', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
  });
});

describe('daysBetween', () => {
  it('is zero for the same day', () => {
    expect(daysBetween('2026-09-09', '2026-09-09')).toBe(0);
  });

  it('is positive when b is after a and negative when before', () => {
    expect(daysBetween('2026-09-09', '2026-09-12')).toBe(3);
    expect(daysBetween('2026-09-12', '2026-09-09')).toBe(-3);
  });

  it('counts whole days across a leap year', () => {
    expect(daysBetween('2024-01-01', '2025-01-01')).toBe(366);
    expect(daysBetween('2025-01-01', '2026-01-01')).toBe(365);
  });

  it('counts whole days across US DST transitions', () => {
    // Spring forward (2026-03-08) and fall back (2026-11-01) must not
    // produce 0.958.. or 1.041.. day spans.
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
    expect(Number.isInteger(daysBetween('2026-03-07', '2026-03-08'))).toBe(true);
    expect(daysBetween('2026-11-01', '2026-11-02')).toBe(1);
  });
});

describe('eachDay', () => {
  it('is inclusive of both ends', () => {
    expect(eachDay('2026-09-09', '2026-09-12')).toEqual([
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12'
    ]);
  });

  it('returns a single day when start equals end', () => {
    expect(eachDay('2026-09-09', '2026-09-09')).toEqual(['2026-09-09']);
  });

  it('returns an empty array when end is before start', () => {
    expect(eachDay('2026-09-09', '2026-09-08')).toEqual([]);
  });

  it('spans month boundaries', () => {
    expect(eachDay('2026-01-30', '2026-02-02')).toEqual([
      '2026-01-30',
      '2026-01-31',
      '2026-02-01',
      '2026-02-02'
    ]);
  });
});

describe('compareDateKeys', () => {
  it('orders keys chronologically', () => {
    expect(compareDateKeys('2026-09-09', '2026-09-10')).toBe(-1);
    expect(compareDateKeys('2026-09-10', '2026-09-09')).toBe(1);
    expect(compareDateKeys('2026-09-09', '2026-09-09')).toBe(0);
  });

  it('sorts an array ascending', () => {
    const keys: DateKey[] = ['2026-12-01', '2025-01-31', '2026-01-02'];
    expect([...keys].sort(compareDateKeys)).toEqual([
      '2025-01-31',
      '2026-01-02',
      '2026-12-01'
    ]);
  });
});

describe('minDateKey / maxDateKey', () => {
  const keys: DateKey[] = ['2026-05-04', '2025-12-31', '2026-05-05'];

  it('finds the earliest and latest key regardless of input order', () => {
    expect(minDateKey(keys)).toBe('2025-12-31');
    expect(maxDateKey(keys)).toBe('2026-05-05');
  });

  it('returns the only key for a single-element array', () => {
    expect(minDateKey(['2026-01-01'])).toBe('2026-01-01');
    expect(maxDateKey(['2026-01-01'])).toBe('2026-01-01');
  });

  it('returns undefined for an empty array', () => {
    expect(minDateKey([])).toBeUndefined();
    expect(maxDateKey([])).toBeUndefined();
  });

  it('does not mutate the input', () => {
    const input: DateKey[] = [...keys];
    minDateKey(input);
    maxDateKey(input);
    expect(input).toEqual(keys);
  });
});

describe('formatters', () => {
  it('formats short labels in en-US', () => {
    expect(formatShort('2026-09-09')).toBe('Sep 9');
    expect(formatShort('2026-12-25')).toBe('Dec 25');
  });

  it('formats weekday labels in en-US', () => {
    expect(formatWeekday('2026-09-09')).toBe('Wed, Sep 9');
  });

  it('formats long labels in en-US', () => {
    expect(formatLong('2026-09-09')).toBe('Sep 9, 2026');
  });

  it('does not shift a day at the year boundary', () => {
    // Keys parse to UTC midnight, so a negative-offset runtime timezone must
    // not roll these back to Dec 31.
    expect(formatShort('2026-01-01')).toBe('Jan 1');
    expect(formatWeekday('2026-01-01')).toBe('Thu, Jan 1');
    expect(formatLong('2026-01-01')).toBe('Jan 1, 2026');
    expect(formatLong('2025-12-31')).toBe('Dec 31, 2025');
  });
});
