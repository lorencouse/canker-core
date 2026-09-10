import { describe, expect, it } from 'vitest';

import type { Sore } from '@/types';
import { dayNumberOf, hasReadingOn, latest, withReading } from './readings';

const at = (iso: string) => new Date(iso);

const sore = (overrides: Partial<Sore> = {}): Sore => ({
  id: 'a',
  user_id: 'u',
  zone: 'Tongue',
  view: 'front',
  x: 50,
  y: 50,
  dates: ['2026-09-08T09:00:00.000Z'],
  size: [3],
  pain: [4],
  healed: null,
  ...overrides
});

describe('withReading', () => {
  it('appends a reading on a new day, carrying the other value forward', () => {
    const next = withReading(sore(), { pain: 7 }, at('2026-09-09T09:00:00Z'));
    expect(next.dates).toHaveLength(2);
    expect(next.size).toEqual([3, 3]);
    expect(next.pain).toEqual([4, 7]);
  });

  it('corrects the reading in place on the same day', () => {
    const first = withReading(sore(), { pain: 7 }, at('2026-09-09T09:00:00Z'));
    const second = withReading(first, { size: 5 }, at('2026-09-09T21:00:00Z'));
    expect(second.dates).toEqual(first.dates);
    expect(second.size).toEqual([3, 5]);
    expect(second.pain).toEqual([4, 7]);
  });

  it('starts a series with defaults when the sore has none', () => {
    const next = withReading(
      sore({ dates: null, size: null, pain: null }),
      { size: 4 },
      at('2026-09-09T09:00:00Z')
    );
    expect(next.dates).toHaveLength(1);
    expect(next.size).toEqual([4]);
    expect(next.pain).toEqual([3]);
  });

  it('does not mutate the sore it was given', () => {
    const original = sore();
    withReading(original, { pain: 9 }, at('2026-09-09T09:00:00Z'));
    expect(original.pain).toEqual([4]);
    expect(original.dates).toHaveLength(1);
  });
});

describe('hasReadingOn', () => {
  it('compares local calendar days, not 24-hour windows', () => {
    const s = sore({ dates: ['2026-09-08T23:30:00'] });
    expect(hasReadingOn(s, at('2026-09-08T00:10:00'))).toBe(true);
    expect(hasReadingOn(s, at('2026-09-09T00:10:00'))).toBe(false);
  });
});

describe('dayNumberOf', () => {
  it('counts the first day as day 1', () => {
    expect(dayNumberOf(sore(), at('2026-09-08T20:00:00Z'))).toBe(1);
    expect(dayNumberOf(sore(), at('2026-09-10T09:00:00Z'))).toBe(3);
  });

  it('stops counting at the healed date', () => {
    const healed = sore({ healed: '2026-09-11T09:00:00.000Z' });
    expect(dayNumberOf(healed, at('2026-12-01T00:00:00Z'))).toBe(4);
  });

  it('is null for a sore with no readings', () => {
    expect(dayNumberOf(sore({ dates: null }))).toBeNull();
  });
});

describe('latest', () => {
  it('returns the last value or null', () => {
    expect(latest([1, 2, 3])).toBe(3);
    expect(latest([])).toBeNull();
    expect(latest(null)).toBeNull();
  });
});
