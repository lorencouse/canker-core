import type { DateKey } from '../dates';
import { computeRhythm } from './rhythm';
import type { FlareUp } from './types';

function flare(started_on: DateKey): FlareUp {
  return {
    started_on,
    ended_on: started_on,
    days: 1,
    is_active: false,
    sore_ids: [],
    peak_pain: null
  };
}

describe('computeRhythm', () => {
  it('returns empty lists and nulls with no flare-ups', () => {
    expect(computeRhythm([])).toEqual({
      flare_starts: [],
      gaps_days: [],
      mean_gap_days: null,
      median_gap_days: null
    });
  });

  it('has no gap and null stats with a single flare-up', () => {
    expect(computeRhythm([flare('2026-01-01')])).toEqual({
      flare_starts: ['2026-01-01'],
      gaps_days: [],
      mean_gap_days: null,
      median_gap_days: null
    });
  });

  it('sorts starts and measures the gaps between them', () => {
    const out = computeRhythm([
      flare('2026-01-31'),
      flare('2026-01-01'),
      flare('2026-01-11')
    ]);
    expect(out).toEqual({
      flare_starts: ['2026-01-01', '2026-01-11', '2026-01-31'],
      gaps_days: [10, 20],
      mean_gap_days: 15,
      median_gap_days: 15
    });
  });

  it('distinguishes mean from median with an odd number of gaps', () => {
    const out = computeRhythm([
      flare('2026-01-01'),
      flare('2026-01-04'),
      flare('2026-01-14'),
      flare('2026-01-16')
    ]);
    expect(out.gaps_days).toEqual([3, 10, 2]);
    expect(out.mean_gap_days).toBe(5);
    expect(out.median_gap_days).toBe(3);
  });
});
