import { describe, expect, it } from 'vitest';

import type { Reading, Sore } from '@/types';
import { answerLine, courseOf, courseSentence, trendOf } from './course';

/** Local noon, so a test never straddles a day boundary in any timezone. */
const at = (day: string, hour = 12) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, hour);
};

const reading = (day: string, size: number, pain: number): Reading => ({
  id: `r-${day}`,
  recorded_at: at(day).toISOString(),
  size,
  pain,
  note: null
});

const sore = (overrides: Partial<Sore> = {}): Sore => ({
  id: 'a',
  user_id: 'u',
  view: 'front',
  x: 50,
  y: 50,
  zone: 'Tongue',
  created_at: at('2026-09-01').toISOString(),
  healed_at: null,
  readings: [],
  ...overrides
});

describe('courseOf', () => {
  it('gives one cell per calendar day up to today', () => {
    const days = courseOf(
      sore({ readings: [reading('2026-09-01', 4, 5)] }),
      at('2026-09-04')
    );
    expect(days.map((d) => d.n)).toEqual([1, 2, 3, 4]);
    expect(days[0].day).toBe('2026-09-01');
  });

  it('leaves days with no reading null rather than dropping them', () => {
    const days = courseOf(
      sore({ readings: [reading('2026-09-01', 4, 5), reading('2026-09-03', 3, 2)] }),
      at('2026-09-03')
    );
    expect(days.map((d) => d.pain)).toEqual([5, null, 2]);
    expect(days.map((d) => d.size)).toEqual([4, null, 3]);
  });

  it('stops at the healed day and marks it', () => {
    const days = courseOf(
      sore({
        healed_at: at('2026-09-03').toISOString(),
        readings: [reading('2026-09-01', 4, 5)]
      }),
      at('2026-12-01')
    );
    expect(days).toHaveLength(3);
    expect(days.map((d) => d.isHealedDay)).toEqual([false, false, true]);
  });

  it('counts a sore marked late last night as being on its second day', () => {
    const days = courseOf(
      sore({ created_at: at('2026-09-01', 23).toISOString() }),
      at('2026-09-02', 9)
    );
    expect(days).toHaveLength(2);
  });
});

describe('trendOf', () => {
  it('is null on a single reading, because there is nothing to compare', () => {
    expect(trendOf(sore({ readings: [reading('2026-09-01', 4, 5)] }))).toBeNull();
  });

  it('compares the latest reading with the one before it', () => {
    const trend = trendOf(
      sore({ readings: [reading('2026-09-01', 4, 5), reading('2026-09-02', 3, 5)] })
    );
    expect(trend).toEqual({ size: 'down', pain: 'same', against: 'yesterday' });
  });

  it('says "last time" when the previous reading was not yesterday', () => {
    const trend = trendOf(
      sore({ readings: [reading('2026-09-01', 4, 5), reading('2026-09-05', 6, 7)] })
    );
    expect(trend).toMatchObject({ size: 'up', pain: 'up', against: 'last time' });
  });
});

describe('courseSentence', () => {
  const two = (a: [number, number], b: [number, number]) =>
    sore({ readings: [reading('2026-09-03', ...a), reading('2026-09-04', ...b)] });

  it('asks for today when today has no reading', () => {
    expect(
      courseSentence(sore({ readings: [reading('2026-09-01', 4, 5)] }), at('2026-09-03'))
    ).toBe('Day 3. Nothing logged yet today.');
  });

  it('names both directions when both moved', () => {
    expect(courseSentence(two([5, 6], [3, 4]), at('2026-09-04'))).toBe(
      'Day 4. Narrower than yesterday, and hurting less.'
    );
  });

  it('holds one side steady when only the other moved', () => {
    expect(courseSentence(two([5, 6], [5, 8]), at('2026-09-04'))).toBe(
      'Day 4. Hurting more than yesterday, the same width.'
    );
    expect(courseSentence(two([5, 6], [7, 6]), at('2026-09-04'))).toBe(
      'Day 4. Wider than yesterday, hurting the same.'
    );
  });

  it('says so plainly when nothing changed', () => {
    expect(courseSentence(two([5, 6], [5, 6]), at('2026-09-04'))).toBe(
      'Day 4. No change since yesterday.'
    );
  });

  it('reports a healed sore in the past tense', () => {
    expect(
      courseSentence(
        sore({ healed_at: at('2026-09-05').toISOString() }),
        at('2026-09-20')
      )
    ).toBe('Healed after 5 days.');
  });
});

describe('answerLine', () => {
  it('invites a first mark when there is no history at all', () => {
    expect(answerLine([], at('2026-09-04')).headline).toBe('Nothing logged yet.');
  });

  it('counts the clear days once everything has healed', () => {
    const healed = sore({ healed_at: at('2026-09-01').toISOString() });
    expect(answerLine([healed], at('2026-09-12'))).toEqual({
      headline: 'Nothing open right now.',
      note: '11 days clear.'
    });
  });

  it('leads with the single open sore', () => {
    const one = sore({
      readings: [reading('2026-09-03', 5, 6), reading('2026-09-04', 4, 6)]
    });
    expect(answerLine([one], at('2026-09-04')).headline).toBe(
      'Day 4. Narrower than yesterday, hurting the same.'
    );
  });

  it('flags a sore past two weeks', () => {
    const old = sore({
      created_at: at('2026-08-01').toISOString(),
      readings: [reading('2026-09-04', 5, 6)]
    });
    expect(answerLine([old], at('2026-09-04')).note).toMatch(/dentist/);
  });

  it('counts several and describes the longest-running one', () => {
    const older = sore({
      id: 'b',
      zone: 'Left cheek',
      created_at: at('2026-09-01').toISOString(),
      readings: [reading('2026-09-04', 5, 6)]
    });
    const newer = sore({
      id: 'c',
      created_at: at('2026-09-03').toISOString(),
      readings: [reading('2026-09-04', 2, 2)]
    });
    const answer = answerLine([older, newer], at('2026-09-04'));
    expect(answer.headline).toBe('2 sores open.');
    expect(answer.note).toBe('Longest is the left cheek one — day 4. First reading logged.');
  });
});
