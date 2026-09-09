import type { UserDataset } from '../types';
import {
  computeTreatmentOutcomes,
  NO_TREATMENT_ID,
  NO_TREATMENT_NAME
} from './treatments';
import {
  buildDataset,
  makeEntry,
  makeEntryFactor,
  makeFactor,
  makeLog,
  makeSore
} from './fixtures';

const TODAY = '2026-06-30';

interface Fixture {
  data: UserDataset;
  gel: string;
  rinse: string;
}

/**
 * Healed sores:
 *   s1 5d gel (sore-specific)      s2 7d gel (general day)   s7 3d gel (same general day as s2)
 *   s3 9d gel (specific to s3)     s8 3d none (s3's gel does not apply)
 *   s4 3d none (archived + food factors only)   s5 8d rinse
 *   s9 3d none (gel logged after it healed)     s6 active, gel (excluded)
 */
function fixture(): Fixture {
  const gel = makeFactor({ kind: 'treatment', name: 'Gel' });
  const rinse = makeFactor({ kind: 'treatment', name: 'Rinse' });
  const old = makeFactor({
    kind: 'treatment',
    name: 'Old',
    archived_at: '2026-01-01T00:00:00Z'
  });
  const chocolate = makeFactor({ kind: 'food', name: 'Chocolate' });

  const s1 = makeSore({ onset_date: '2026-03-01', healed_date: '2026-03-05' });
  const s2 = makeSore({ onset_date: '2026-03-10', healed_date: '2026-03-16' });
  const s7 = makeSore({ onset_date: '2026-03-10', healed_date: '2026-03-12' });
  const s3 = makeSore({ onset_date: '2026-03-20', healed_date: '2026-03-28' });
  const s8 = makeSore({ onset_date: '2026-03-20', healed_date: '2026-03-22' });
  const s4 = makeSore({ onset_date: '2026-04-01', healed_date: '2026-04-03' });
  const s5 = makeSore({ onset_date: '2026-04-10', healed_date: '2026-04-17' });
  const s9 = makeSore({ onset_date: '2026-05-01', healed_date: '2026-05-03' });
  const s6 = makeSore({ onset_date: '2026-06-20', healed_date: null });

  const data = buildDataset({
    sores: [s1, s2, s7, s3, s8, s4, s5, s9, s6],
    factors: [gel, rinse, old, chocolate],
    soreLogs: [
      makeLog({ sore_id: s1.id, log_date: '2026-03-02', pain: 4 }),
      makeLog({ sore_id: s2.id, log_date: '2026-03-11', pain: 6 })
    ],
    dailyEntries: [
      '2026-03-02',
      '2026-03-11',
      '2026-03-21',
      '2026-04-02',
      '2026-04-11',
      '2026-05-05',
      '2026-06-21'
    ].map((entry_date) => makeEntry({ entry_date })),
    entryFactors: [
      makeEntryFactor({ factor_id: gel.id, date: '2026-03-02', sore_id: s1.id }),
      makeEntryFactor({ factor_id: gel.id, date: '2026-03-11' }),
      makeEntryFactor({ factor_id: gel.id, date: '2026-03-21', sore_id: s3.id }),
      makeEntryFactor({ factor_id: old.id, date: '2026-04-02' }),
      makeEntryFactor({ factor_id: chocolate.id, date: '2026-04-02' }),
      makeEntryFactor({ factor_id: rinse.id, date: '2026-04-11' }),
      makeEntryFactor({ factor_id: gel.id, date: '2026-05-05' }),
      makeEntryFactor({ factor_id: gel.id, date: '2026-06-21' })
    ]
  });
  return { data, gel: gel.id, rinse: rinse.id };
}

describe('computeTreatmentOutcomes', () => {
  it('returns nothing without healed sores', () => {
    expect(computeTreatmentOutcomes(buildDataset(), TODAY)).toEqual([]);
    const active = buildDataset({ sores: [makeSore({ healed_date: null })] });
    expect(computeTreatmentOutcomes(active, TODAY)).toEqual([]);
  });

  it('puts the untreated group first and lists treatments meeting the sore threshold', () => {
    const { data, gel } = fixture();
    const out = computeTreatmentOutcomes(data, TODAY);
    expect(out).toEqual([
      {
        factor_id: NO_TREATMENT_ID,
        name: NO_TREATMENT_NAME,
        sores: 3,
        median_days_to_heal: 3,
        median_peak_pain: null
      },
      {
        factor_id: gel,
        name: 'Gel',
        sores: 4,
        median_days_to_heal: 6,
        median_peak_pain: 5
      }
    ]);
  });

  it('counts a general treatment day for every sore active that day, but a sore-specific one only for that sore', () => {
    const { data } = fixture();
    // s7 shares the general gel day with s2 (counted); s8 shares s3's sore-specific day (not counted).
    const out = computeTreatmentOutcomes(data, TODAY, { minSoresPerTreatment: 1 });
    const gel = out.find((o) => o.name === 'Gel');
    const none = out.find((o) => o.factor_id === NO_TREATMENT_ID);
    expect(gel?.sores).toBe(4);
    expect(none?.sores).toBe(3);
  });

  it('honours minSoresPerTreatment and sorts treatments by median days then name', () => {
    const { data, gel, rinse } = fixture();
    const out = computeTreatmentOutcomes(data, TODAY, { minSoresPerTreatment: 1 });
    expect(out.map((o) => o.factor_id)).toEqual([NO_TREATMENT_ID, gel, rinse]);
    expect(out[2]).toMatchObject({
      name: 'Rinse',
      sores: 1,
      median_days_to_heal: 8,
      median_peak_pain: null
    });
  });

  it('omits the untreated group when every healed sore was treated', () => {
    const gel = makeFactor({ kind: 'treatment', name: 'Gel' });
    const sore = makeSore({ onset_date: '2026-03-01', healed_date: '2026-03-03' });
    const data = buildDataset({
      sores: [sore],
      factors: [gel],
      dailyEntries: [makeEntry({ entry_date: '2026-03-01' })],
      entryFactors: [makeEntryFactor({ factor_id: gel.id, date: '2026-03-01' })]
    });
    expect(computeTreatmentOutcomes(data, TODAY, { minSoresPerTreatment: 1 })).toEqual([
      {
        factor_id: gel.id,
        name: 'Gel',
        sores: 1,
        median_days_to_heal: 3,
        median_peak_pain: null
      }
    ]);
  });
});
