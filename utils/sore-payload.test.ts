import { describe, expect, it } from 'vitest';

import type { Reading, Sore } from '@/types';
import {
  CLOCK_SKEW_MS,
  MAX_READINGS_PER_SORE,
  MAX_SORES_PER_SAVE,
  dayKeyIn,
  isTimeZone,
  parseSores,
  sameDayReading
} from './sore-payload';

const NOW = new Date('2026-09-10T12:00:00.000Z');

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

/** Typed as unknown, the way a hand-built request arrives. */
const parse = (input: unknown) => parseSores(input, NOW);

describe('parseSores', () => {
  it('accepts what the client sends', () => {
    const result = parse([sore()]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.sores[0].readings[0]).toEqual(reading());
  });

  it('accepts timestamps in the offset form the database reads them back in', () => {
    const result = parse([
      sore({
        created_at: '2026-09-08T09:00:00.123456+00:00',
        readings: [reading({ recorded_at: '2026-09-08T11:00:00+02:00' })]
      })
    ]);
    expect(result.ok).toBe(true);
  });

  it('drops a client-supplied user_id', () => {
    const result = parse([sore({ user_id: 'someone-else' })]);
    expect(result.ok && result.sores[0].user_id).toBe('');
  });

  it('fills a missing note with null', () => {
    const { note: _note, ...bare } = reading();
    const result = parse([sore({ readings: [bare as Reading] })]);
    expect(result.ok && result.sores[0].readings[0].note).toBeNull();
  });

  it('accepts an empty save and a sore with no position', () => {
    expect(parse([]).ok).toBe(true);
    expect(parse([sore({ x: null, y: null })]).ok).toBe(true);
  });

  it.each(['front', 'cheeks', 'lips'])('accepts the %s view', (view) => {
    expect(parse([{ ...sore(), view }]).ok).toBe(true);
  });

  it('refuses a view the map does not have', () => {
    const result = parse([{ ...sore(), view: 'gums' }]);
    expect(result).toEqual({ ok: false, error: expect.stringContaining('0.view') });
  });

  it.each([
    ['x', -0.1],
    ['x', 100.1],
    ['y', -5],
    ['y', 250],
    ['x', Number.NaN],
    ['y', Number.POSITIVE_INFINITY]
  ])('refuses %s = %s', (key, value) => {
    expect(parse([{ ...sore(), [key]: value }]).ok).toBe(false);
  });

  it('accepts the edges of the box', () => {
    expect(parse([sore({ x: 0, y: 100 })]).ok).toBe(true);
  });

  it.each(['yesterday', '2026-09-08', '2026-13-01T00:00:00Z', '', 1757322000000])(
    'refuses %j as a timestamp',
    (value) => {
      expect(parse([{ ...sore(), created_at: value }]).ok).toBe(false);
      expect(parse([sore({ readings: [{ ...reading(), recorded_at: value as string }] })]).ok).toBe(
        false
      );
    }
  );

  it('refuses a reading from the future, beyond clock slack', () => {
    const later = (ms: number) => new Date(NOW.getTime() + ms).toISOString();
    expect(parse([sore({ readings: [reading({ recorded_at: later(CLOCK_SKEW_MS) })] })]).ok).toBe(
      true
    );
    const result = parse([
      sore({ readings: [reading({ recorded_at: later(CLOCK_SKEW_MS + 1000) })] })
    ]);
    expect(result).toEqual({
      ok: false,
      error: '0.readings.0.recorded_at: is in the future'
    });
  });

  it('refuses a sore created, or healed, in the future', () => {
    expect(parse([sore({ created_at: '2026-09-11T12:00:00.000Z' })]).ok).toBe(false);
    expect(parse([sore({ healed_at: '2026-09-11T12:00:00.000Z' })]).ok).toBe(false);
  });

  it('refuses a size or pain that is not a number', () => {
    expect(parse([sore({ readings: [{ ...reading(), size: '3' as unknown as number }] })]).ok).toBe(
      false
    );
    expect(parse([sore({ readings: [{ ...reading(), pain: Number.NaN }] })]).ok).toBe(false);
  });

  it('refuses a payload that is not a list of sores', () => {
    expect(parse(null).ok).toBe(false);
    expect(parse({ 0: sore() }).ok).toBe(false);
    expect(parse([{ ...sore(), readings: undefined }]).ok).toBe(false);
    expect(parse([{ ...sore(), id: '' }]).ok).toBe(false);
  });

  it('caps the number of sores and of readings', () => {
    const many = Array.from({ length: MAX_SORES_PER_SAVE + 1 }, (_, i) => sore({ id: `s${i}` }));
    expect(parse(many.slice(0, -1)).ok).toBe(true);
    expect(parse(many).ok).toBe(false);

    const readings = Array.from({ length: MAX_READINGS_PER_SORE + 1 }, (_, i) =>
      reading({ id: `r${i}` })
    );
    expect(parse([sore({ readings: readings.slice(0, -1) })]).ok).toBe(true);
    expect(parse([sore({ readings })]).ok).toBe(false);
  });
});

describe('isTimeZone', () => {
  it('knows IANA zones and nothing else', () => {
    expect(isTimeZone('Europe/London')).toBe(true);
    expect(isTimeZone('UTC')).toBe(true);
    expect(isTimeZone('Mars/Olympus_Mons')).toBe(false);
    expect(isTimeZone('')).toBe(false);
    expect(isTimeZone(undefined)).toBe(false);
  });
});

describe('dayKeyIn', () => {
  it('puts an instant on the calendar day of the given zone', () => {
    // 03:00 UTC is still the previous evening in New York.
    expect(dayKeyIn('2026-09-09T03:00:00Z', 'America/New_York')).toBe('2026-09-08');
    expect(dayKeyIn('2026-09-09T03:00:00Z', 'Europe/London')).toBe('2026-09-09');
    expect(dayKeyIn('2026-09-09T03:00:00+00:00', 'UTC')).toBe('2026-09-09');
  });
});

describe('sameDayReading', () => {
  const none = new Map<string, string>();
  const stored = (...rs: Reading[]) => new Map(rs.map((r) => [r.id, r.recorded_at]));

  const morning = reading({ id: 'm', recorded_at: '2026-09-08T07:00:00Z' });
  const evening = reading({ id: 'e', recorded_at: '2026-09-08T20:00:00Z' });
  const nextDay = reading({ id: 'n', recorded_at: '2026-09-09T08:00:00Z' });

  it('passes one reading a day', () => {
    expect(sameDayReading([morning, nextDay], none, 'UTC')).toBeNull();
  });

  it('catches a new second reading on a day', () => {
    expect(sameDayReading([morning, evening], stored(morning), 'UTC')).toBe(evening);
  });

  it('catches two new readings on one day', () => {
    expect(sameDayReading([morning, evening], none, 'UTC')).not.toBeNull();
  });

  it('draws the day line in the device zone, not UTC', () => {
    // 23:30 and 00:30 New York time: two days there, one day in UTC.
    const late = reading({ id: 'l', recorded_at: '2026-09-09T03:30:00Z' });
    const early = reading({ id: 'x', recorded_at: '2026-09-09T04:30:00Z' });
    expect(sameDayReading([late, early], stored(late), 'America/New_York')).toBeNull();
    expect(sameDayReading([late, early], stored(late), 'UTC')).toBe(early);

    // 20:00 and 07:00 the next morning in Tokyo: two days there, one in UTC.
    const tokyoEvening = reading({ id: 't1', recorded_at: '2026-09-08T11:00:00Z' });
    const tokyoMorning = reading({ id: 't2', recorded_at: '2026-09-08T22:00:00Z' });
    const tokyo = [tokyoEvening, tokyoMorning];
    expect(sameDayReading(tokyo, stored(tokyoEvening), 'Asia/Tokyo')).toBeNull();
    expect(sameDayReading(tokyo, stored(tokyoEvening), 'UTC')).toBe(tokyoMorning);
  });

  it('lets a same-day correction through, which keeps its timestamp', () => {
    const corrected = { ...evening, size: 5, pain: 2 };
    expect(sameDayReading([nextDay, corrected], stored(nextDay, evening), 'UTC')).toBeNull();
  });

  it('does not re-judge stored readings in a new zone', () => {
    // Two readings that were separate days where they were taken, now on
    // one day in the zone the user has travelled to.
    expect(sameDayReading([morning, evening], stored(morning, evening), 'UTC')).toBeNull();
  });

  it('matches stored timestamps by instant, not by spelling', () => {
    const asStored = new Map([[evening.id, '2026-09-08T20:00:00+00:00']]);
    expect(sameDayReading([morning, evening], asStored, 'UTC')).toBe(morning);
  });

  it('re-checks a stored reading whose date moved', () => {
    const moved = { ...evening, recorded_at: '2026-09-09T09:00:00Z' };
    const before = stored(morning, evening, nextDay);
    expect(sameDayReading([morning, moved, nextDay], before, 'UTC')).toBe(moved);
  });
});
