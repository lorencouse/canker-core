import { DERIVED_FACTORS } from '../factors';
import { addDays } from '../dates';
import type { DateKey } from '../dates';
import type { UserDataset } from '../types';
import { computeTriggerLift } from './triggers';
import {
  buildDataset,
  makeEntries,
  makeEntryFactor,
  makeFactor,
  makeSore
} from './fixtures';

const TODAY = '2026-06-30';
const ONSETS: DateKey[] = [
  '2026-03-10',
  '2026-03-30',
  '2026-04-20',
  '2026-05-10',
  '2026-05-30'
];
/** Second day of each default 1..3 window. */
const IN_WINDOW = ONSETS.map((o) => addDays(o, -2));

/**
 * Five onsets, a daily entry on every day from March 1 to June 10 (102 days),
 * and 'Chocolate' logged inside 4 of the 5 windows plus 2 ordinary days.
 */
function baseDataset(): { data: UserDataset; chocolate: string } {
  const chocolate = makeFactor({ kind: 'food', name: 'Chocolate' });
  const sores = ONSETS.map((onset) =>
    makeSore({ onset_date: onset, healed_date: addDays(onset, 5) })
  );
  const data = buildDataset({
    sores,
    factors: [chocolate],
    dailyEntries: makeEntries('2026-03-01', '2026-06-10', {
      sleep_quality: 3,
      stress: 1
    }),
    entryFactors: [
      ...IN_WINDOW.slice(0, 4).map((date) =>
        makeEntryFactor({ factor_id: chocolate.id, date })
      ),
      makeEntryFactor({ factor_id: chocolate.id, date: '2026-04-01' }),
      makeEntryFactor({ factor_id: chocolate.id, date: '2026-04-30' }),
      // Tied to a sore: a treatment application, never an exposure. Sits in window 5.
      makeEntryFactor({
        factor_id: chocolate.id,
        date: IN_WINDOW[4]!,
        sore_id: sores[4]!.id
      })
    ]
  });
  return { data, chocolate: chocolate.id };
}

describe('computeTriggerLift', () => {
  it('lifts a factor that precedes 4 of 5 onsets and is rare elsewhere', () => {
    const { data, chocolate } = baseDataset();
    const out = computeTriggerLift(data, TODAY);
    expect(out.triggers_ready).toBe(true);
    expect(out.onsets_until_triggers).toBe(0);
    expect(out.triggers).toHaveLength(1);
    const lift = out.triggers[0]!;
    expect(lift).toMatchObject({
      factor_id: chocolate,
      name: 'Chocolate',
      kind: 'food',
      derived: false,
      window_hits: 4,
      onsets: 5,
      window_rate: 0.8,
      // 2 baseline days / (102 entry days - 15 window days - 5 onset days)
      baseline_rate: 0.02
    });
    expect(lift.lift).toBeGreaterThan(1);
    expect(lift.lift).toBeCloseTo(32.8, 1);
  });

  it('ignores sore-tied entry factors when counting window hits', () => {
    const { data } = baseDataset();
    // The only chocolate row in window 5 carries a sore_id, so hits stay at 4.
    expect(computeTriggerLift(data, TODAY).triggers[0]?.window_hits).toBe(4);
  });

  it('drops factors below minFactorHits', () => {
    const { data } = baseDataset();
    const coffee = makeFactor({ kind: 'food', name: 'Coffee' });
    data.factors.push(coffee);
    data.entryFactors.push(
      makeEntryFactor({ factor_id: coffee.id, date: IN_WINDOW[0]! }),
      makeEntryFactor({ factor_id: coffee.id, date: IN_WINDOW[1]! }),
      makeEntryFactor({ factor_id: coffee.id, date: '2026-04-02' })
    );
    const names = computeTriggerLift(data, TODAY).triggers.map((t) => t.name);
    expect(names).not.toContain('Coffee');
    expect(
      computeTriggerLift(data, TODAY, { minFactorHits: 2 }).triggers.map((t) => t.name)
    ).toContain('Coffee');
  });

  it('reports Infinity lift for a factor never seen outside a window and sorts it first', () => {
    const { data } = baseDataset();
    const nuts = makeFactor({ kind: 'food', name: 'Nuts' });
    data.factors.push(nuts);
    data.entryFactors.push(
      ...IN_WINDOW.slice(0, 3).map((date) =>
        makeEntryFactor({ factor_id: nuts.id, date })
      )
    );
    const triggers = computeTriggerLift(data, TODAY).triggers;
    expect(triggers.map((t) => t.name)).toEqual(['Nuts', 'Chocolate']);
    expect(triggers[0]).toMatchObject({
      window_hits: 3,
      baseline_rate: 0,
      window_rate: 0.6,
      lift: Infinity
    });
  });

  it('excludes archived factors and treatment-kind factors', () => {
    const { data } = baseDataset();
    const archived = makeFactor({
      kind: 'food',
      name: 'Archived',
      archived_at: '2026-06-01T00:00:00Z'
    });
    const gel = makeFactor({ kind: 'treatment', name: 'Gel' });
    data.factors.push(archived, gel);
    for (const date of IN_WINDOW) {
      data.entryFactors.push(
        makeEntryFactor({ factor_id: archived.id, date }),
        makeEntryFactor({ factor_id: gel.id, date })
      );
    }
    expect(computeTriggerLift(data, TODAY).triggers.map((t) => t.name)).toEqual([
      'Chocolate'
    ]);
  });

  it('derives a poor-sleep pseudo-factor from daily entries', () => {
    const { data } = baseDataset();
    const poorNights = new Set([IN_WINDOW[0], IN_WINDOW[1], IN_WINDOW[2], IN_WINDOW[3]]);
    for (const e of data.dailyEntries) {
      if (poorNights.has(e.entry_date))
        e.sleep_quality = e.entry_date === IN_WINDOW[3] ? 0 : 1;
      if (e.entry_date === IN_WINDOW[0]) e.stress = 4;
    }
    const triggers = computeTriggerLift(data, TODAY).triggers;
    const sleep = triggers.find((t) => t.factor_id === DERIVED_FACTORS.poorSleep.id);
    expect(sleep).toMatchObject({
      name: 'Poor sleep',
      kind: 'other',
      derived: true,
      window_hits: 4,
      onsets: 5,
      window_rate: 0.8,
      baseline_rate: 0,
      lift: Infinity
    });
    // One stressful day is below minFactorHits.
    expect(
      triggers.find((t) => t.factor_id === DERIVED_FACTORS.highStress.id)
    ).toBeUndefined();
  });

  it('honours a custom trigger window', () => {
    const { data } = baseDataset();
    const spicy = makeFactor({ kind: 'food', name: 'Spicy' });
    data.factors.push(spicy);
    data.entryFactors.push(
      ...ONSETS.slice(0, 4).map((o) =>
        makeEntryFactor({ factor_id: spicy.id, date: addDays(o, -5) })
      )
    );
    expect(computeTriggerLift(data, TODAY).triggers.map((t) => t.name)).not.toContain(
      'Spicy'
    );
    const wide = computeTriggerLift(data, TODAY, { triggerWindow: { from: 4, to: 6 } });
    expect(wide.triggers.find((t) => t.name === 'Spicy')?.window_hits).toBe(4);
  });

  it('is not ready below minOnsetsForTriggers and says how many onsets are missing', () => {
    const { data } = baseDataset();
    data.sores.pop();
    const out = computeTriggerLift(data, TODAY);
    expect(out).toEqual({
      triggers: [],
      triggers_ready: false,
      onsets_until_triggers: 1
    });
    expect(
      computeTriggerLift(data, TODAY, { minOnsetsForTriggers: 4 }).triggers_ready
    ).toBe(true);
  });

  it('counts two sores with the same onset date as two onsets', () => {
    const { data } = baseDataset();
    data.sores.push(
      makeSore({ onset_date: ONSETS[0]!, healed_date: addDays(ONSETS[0]!, 2) })
    );
    const out = computeTriggerLift(data, TODAY);
    expect(out.triggers[0]).toMatchObject({ onsets: 6, window_hits: 5 });
  });

  it('handles an empty dataset', () => {
    expect(computeTriggerLift(buildDataset(), TODAY)).toEqual({
      triggers: [],
      triggers_ready: false,
      onsets_until_triggers: 5
    });
  });
});
