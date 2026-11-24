import { describe, expect, it } from 'vitest';

import {
  EMPTY_STATE,
  REVIEW_PROMPT_RULES,
  isEligible,
  parseState,
  recordAsked,
  recordDayUsed,
  type ReviewPromptState
} from './review-prompt';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-11-24T18:00:00Z');

const usedOn = (...days: string[]) =>
  days.reduce<ReviewPromptState>(recordDayUsed, EMPTY_STATE);

const seasoned = usedOn('2026-11-20', '2026-11-22', '2026-11-24');

describe('recordDayUsed', () => {
  it('counts each local day once', () => {
    const state = usedOn('2026-11-20', '2026-11-20', '2026-11-21');
    expect(state.daysUsed).toBe(2);
    expect(state.lastDayUsed).toBe('2026-11-21');
  });
});

describe('isEligible', () => {
  it('waits for three separate days of use', () => {
    expect(REVIEW_PROMPT_RULES.minDaysUsed).toBe(3);
    expect(isEligible(EMPTY_STATE, now, '1.0')).toBe(false);
    expect(isEligible(usedOn('2026-11-23', '2026-11-24'), now, '1.0')).toBe(
      false
    );
    expect(isEligible(seasoned, now, '1.0')).toBe(true);
  });

  it('never asks twice in the same version', () => {
    const asked = recordAsked(
      seasoned,
      new Date(now.getTime() - 400 * DAY),
      '1.0'
    );
    expect(isEligible(asked, now, '1.0')).toBe(false);
    expect(isEligible(asked, now, '1.1')).toBe(true);
  });

  it('leaves 120 days between asks, even across versions', () => {
    expect(REVIEW_PROMPT_RULES.minDaysBetweenAsks).toBe(120);
    const at = (daysAgo: number) =>
      recordAsked(seasoned, new Date(now.getTime() - daysAgo * DAY), '1.0');
    expect(isEligible(at(119), now, '1.1')).toBe(false);
    expect(isEligible(at(120), now, '1.1')).toBe(true);
  });
});

describe('parseState', () => {
  it('round-trips what it stores', () => {
    const state = recordAsked(seasoned, now, '1.0');
    expect(parseState(JSON.stringify(state))).toEqual(state);
  });

  it('reads anything missing or malformed as a fresh install', () => {
    expect(parseState(null)).toEqual(EMPTY_STATE);
    expect(parseState('{')).toEqual(EMPTY_STATE);
    expect(parseState('"x"')).toEqual(EMPTY_STATE);
    expect(
      parseState(JSON.stringify({ daysUsed: -1, lastAskedAt: 'soon' }))
    ).toEqual(EMPTY_STATE);
  });
});
