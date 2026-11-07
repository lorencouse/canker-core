import { describe, expect, it } from 'vitest';

import type { DayLog } from '@/types';
import { FOOD_TRIGGERS, emptyDayLog } from '@/utils/day-log';
import {
  applyPatch,
  isBlankDayLog,
  mergeTriggers,
  validatePatch
} from './patch';

const DAY = '2026-11-06';
const sleep = (o: Record<string, unknown>) =>
  validatePatch({ sleep: { hours: 7, quality: 3, source: 'manual', ...o } })
    ?.sleep;

describe('validatePatch', () => {
  it('refuses non-objects and empty patches', () => {
    expect(validatePatch('x')).toBeNull();
    expect(validatePatch(null)).toBeNull();
    expect(validatePatch([])).toBeNull();
    expect(validatePatch({})).toBeNull();
  });
  it('drops unknown triggers and non-food from a food list', () => {
    expect(
      validatePatch({ food: ['Coffee', 'Feeling ill', 'Nope'] })?.food
    ).toEqual(['Coffee']);
  });
  it('nulls out-of-range values', () => {
    expect(sleep({ quality: 6 })?.quality).toBeNull();
    expect(sleep({ hours: 25 })?.hours).toBeNull();
    expect(
      validatePatch({ health: { triggers: [], stress: 0 } })?.health?.stress
    ).toBeNull();
  });
  it('keeps valid values', () => {
    expect(sleep({ hours: 7.25 })?.hours).toBe(7.25);
    expect(sleep({ source: 'bogus' })?.source).toBeNull();
    expect(
      validatePatch({ health: { triggers: ['Period', 'Coffee'], stress: 4 } })
        ?.health
    ).toEqual({ triggers: ['Period'], stress: 4 });
  });
  it('refuses a malformed section', () => {
    expect(validatePatch({ sleep: 3 })).toBeNull();
    expect(validatePatch({ food: 'Coffee' })).toBeNull();
    expect(validatePatch({ health: { stress: 3 } })).toBeNull();
  });
});

describe('mergeTriggers', () => {
  it('replaces only the subset, in TRIGGERS order', () => {
    expect(
      mergeTriggers(['Spicy food', 'Period'], FOOD_TRIGGERS, ['Coffee'])
    ).toEqual(['Coffee', 'Period']);
  });
  it('keeps unknown legacy values after known ones', () => {
    expect(mergeTriggers(['Weird', 'Period'], FOOD_TRIGGERS, ['Nuts'])).toEqual(
      ['Nuts', 'Period', 'Weird']
    );
  });
});

describe('applyPatch', () => {
  const full: DayLog = {
    day: DAY,
    triggers: ['Stress', 'Poor sleep', 'Spicy food', 'Period'],
    treatments: ['Numbing gel'],
    note: 'ouch',
    sleep_hours: 5,
    sleep_quality: 2,
    sleep_source: 'manual',
    stress: 4,
    food_answered: false,
    health_answered: false
  };

  it('food sets food_answered and leaves everything else', () => {
    const r = applyPatch(full, DAY, { food: ['Coffee'] });
    expect(r.triggers).toEqual(['Stress', 'Poor sleep', 'Coffee', 'Period']);
    expect(r.food_answered).toBe(true);
    expect(r.health_answered).toBe(false);
    expect(r.treatments).toEqual(['Numbing gel']);
    expect([r.sleep_hours, r.sleep_quality, r.stress, r.note]).toEqual([
      5,
      2,
      4,
      'ouch'
    ]);
  });
  it('sleep removes only the Poor sleep tag', () => {
    const r = applyPatch(full, DAY, {
      sleep: { hours: 8, quality: 4, source: 'manual' }
    });
    expect(r.triggers).toEqual(['Stress', 'Spicy food', 'Period']);
    expect([r.sleep_hours, r.sleep_quality]).toEqual([8, 4]);
    expect(r.food_answered).toBe(false);
  });
  it('health clears legacy Stress and replaces health tags', () => {
    const r = applyPatch(full, DAY, {
      health: { triggers: ['Dental work'], stress: 2 }
    });
    expect(r.triggers).toEqual(['Poor sleep', 'Dental work', 'Spicy food']);
    expect(r.stress).toBe(2);
    expect(r.health_answered).toBe(true);
    expect(r.food_answered).toBe(false);
  });
  it('treatments sets neither answered flag', () => {
    const r = applyPatch(null, DAY, { treatments: ['Painkiller'] });
    expect(r.treatments).toEqual(['Painkiller']);
    expect([r.food_answered, r.health_answered]).toEqual([false, false]);
  });
  it('starts from an empty row', () => {
    expect(applyPatch(null, DAY, { food: [] }).food_answered).toBe(true);
  });
});

describe('isBlankDayLog', () => {
  it('is blank only when nothing is stored', () => {
    expect(isBlankDayLog(emptyDayLog(DAY))).toBe(true);
    expect(isBlankDayLog({ ...emptyDayLog(DAY), food_answered: true })).toBe(
      false
    );
    expect(isBlankDayLog({ ...emptyDayLog(DAY), note: 'x' })).toBe(false);
  });
});
