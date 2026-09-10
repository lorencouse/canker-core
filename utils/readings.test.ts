import { describe, expect, it } from 'vitest';

import type { Reading, Sore } from '@/types';
import {
  currentPain,
  currentSize,
  dayNumberOf,
  hasReadingOn,
  latestReading,
  newReading,
  withReading
} from './readings';

const at = (iso: string) => new Date(iso);

const reading = (overrides: Partial<Reading> = {}): Reading => ({
  id: 'r1',
  recorded_at: '2026-09-08T09:00:00.000Z',
  size: 3,
  pain: 4,
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
  created_at: '2026-09-08T09:00:00.000Z',
  healed_at: null,
  readings: [reading()],
  ...overrides
});

describe('withReading', () => {
  it('appends a reading on a new day, carrying the other value forward', () => {
    const next = withReading(sore(), { pain: 7 }, at('2026-09-09T09:00:00Z'));
    expect(next.readings).toHaveLength(2);
    expect(next.readings[1]).toMatchObject({ size: 3, pain: 7, note: null });
    expect(next.readings[1].id).not.toBe('r1');
  });

  it('corrects the reading in place on the same day', () => {
    const first = withReading(sore(), { pain: 7 }, at('2026-09-09T09:00:00Z'));
    const second = withReading(first, { size: 5 }, at('2026-09-09T21:00:00Z'));
    expect(second.readings).toHaveLength(2);
    expect(second.readings[1]).toMatchObject({ size: 5, pain: 7 });
    expect(second.readings[1].id).toBe(first.readings[1].id);
  });

  it('keeps a same-day note when only a slider moves, and clears it when asked', () => {
    const noted = withReading(sore(), { note: 'stings' }, at('2026-09-08T12:00:00Z'));
    const nudged = withReading(noted, { pain: 6 }, at('2026-09-08T13:00:00Z'));
    expect(nudged.readings[0].note).toBe('stings');
    const cleared = withReading(nudged, { note: null }, at('2026-09-08T14:00:00Z'));
    expect(cleared.readings[0].note).toBeNull();
  });

  it('does not carry a note forward to a new day', () => {
    const noted = sore({ readings: [reading({ note: 'yesterday' })] });
    const next = withReading(noted, { pain: 2 }, at('2026-09-09T09:00:00Z'));
    expect(next.readings[1].note).toBeNull();
  });

  it('starts a series with defaults when the sore has none', () => {
    const next = withReading(sore({ readings: [] }), { size: 4 }, at('2026-09-09T09:00:00Z'));
    expect(next.readings).toHaveLength(1);
    expect(next.readings[0]).toMatchObject({ size: 4, pain: 3 });
  });

  it('does not mutate the sore it was given', () => {
    const original = sore();
    withReading(original, { pain: 9 }, at('2026-09-09T09:00:00Z'));
    expect(original.readings).toHaveLength(1);
    expect(original.readings[0].pain).toBe(4);
  });
});

describe('current values', () => {
  it('read the latest reading or fall back to defaults', () => {
    const s = sore({ readings: [reading(), reading({ id: 'r2', size: 6, pain: 8 })] });
    expect(latestReading(s)?.id).toBe('r2');
    expect(currentSize(s)).toBe(6);
    expect(currentPain(s)).toBe(8);
    expect(currentSize(sore({ readings: [] }))).toBe(3);
    expect(latestReading(null)).toBeNull();
  });

  it('newReading uses the defaults and the given time', () => {
    const r = newReading(at('2026-09-09T09:00:00Z'));
    expect(r).toMatchObject({ size: 3, pain: 3, note: null, recorded_at: '2026-09-09T09:00:00.000Z' });
  });
});

describe('hasReadingOn', () => {
  it('compares local calendar days, not 24-hour windows', () => {
    const s = sore({ readings: [reading({ recorded_at: '2026-09-08T23:30:00' })] });
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
    const healed = sore({ healed_at: '2026-09-11T09:00:00.000Z' });
    expect(dayNumberOf(healed, at('2026-12-01T00:00:00Z'))).toBe(4);
  });
});
