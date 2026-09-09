import type { Sore, SoreLog } from './types';
import { isActiveSore, joinSoreLogs, latestLog } from './types';
import { makeLog, makeSore } from './insights/fixtures';

describe('joinSoreLogs', () => {
  it('attaches each log to its own sore', () => {
    const a = makeSore({ onset_date: '2026-01-01' });
    const b = makeSore({ onset_date: '2026-02-01' });
    const aLog = makeLog({ sore_id: a.id, log_date: '2026-01-02' });
    const bLog = makeLog({ sore_id: b.id, log_date: '2026-02-02' });

    const joined = joinSoreLogs([a, b], [bLog, aLog]);

    expect(joined.map((s) => s.id)).toEqual([a.id, b.id]);
    expect(joined[0]?.logs).toEqual([aLog]);
    expect(joined[1]?.logs).toEqual([bLog]);
  });

  it('sorts each sore logs by date ascending', () => {
    const sore = makeSore();
    const jan3 = makeLog({ sore_id: sore.id, log_date: '2026-01-03' });
    const jan1 = makeLog({ sore_id: sore.id, log_date: '2026-01-01' });
    const jan2 = makeLog({ sore_id: sore.id, log_date: '2026-01-02' });

    const joined = joinSoreLogs([sore], [jan3, jan1, jan2]);

    expect(joined[0]?.logs.map((l) => l.log_date)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03'
    ]);
  });

  it('gives sores with no logs an empty array', () => {
    const sore = makeSore();
    const other = makeSore();
    const orphanLog = makeLog({ sore_id: other.id, log_date: '2026-01-01' });

    const joined = joinSoreLogs([sore], [orphanLog]);

    expect(joined).toHaveLength(1);
    expect(joined[0]?.logs).toEqual([]);
  });

  it('keeps the other sore fields intact', () => {
    const sore = makeSore({ surface: 'palate_soft', x: 0.25, notes: 'stings' });
    const joined = joinSoreLogs([sore], []);
    expect(joined[0]).toEqual({ ...sore, logs: [] });
  });

  it('does not mutate the inputs', () => {
    const sore = makeSore();
    const logs = [
      makeLog({ sore_id: sore.id, log_date: '2026-01-03' }),
      makeLog({ sore_id: sore.id, log_date: '2026-01-01' })
    ];
    const sores = [sore];
    const soresBefore = structuredClone(sores);
    const logsBefore = structuredClone(logs);

    joinSoreLogs(sores, logs);

    expect(sores).toEqual(soresBefore);
    expect(logs).toEqual(logsBefore);
    expect(sores[0]).not.toHaveProperty('logs');
  });

  it('returns an empty array for no sores', () => {
    expect(joinSoreLogs([], [])).toEqual([]);
  });
});

describe('isActiveSore', () => {
  it('is true only while healed_date is null', () => {
    expect(isActiveSore({ healed_date: null })).toBe(true);
    expect(isActiveSore({ healed_date: '2026-01-10' })).toBe(false);
  });

  it('works on a full sore', () => {
    expect(isActiveSore(makeSore({ healed_date: null }))).toBe(true);
    expect(isActiveSore(makeSore({ healed_date: '2026-03-01' }))).toBe(false);
  });
});

describe('latestLog', () => {
  it('returns undefined for no logs', () => {
    expect(latestLog([])).toBeUndefined();
  });

  it('picks the log with the greatest date regardless of input order', () => {
    const sore: Sore = makeSore();
    const first = makeLog({ sore_id: sore.id, log_date: '2026-01-01' });
    const last = makeLog({ sore_id: sore.id, log_date: '2026-01-31' });
    const middle = makeLog({ sore_id: sore.id, log_date: '2026-01-15' });
    const logs: SoreLog[] = [middle, last, first];

    expect(latestLog(logs)).toBe(last);
    expect(latestLog([last])).toBe(last);
  });

  it('keeps the first of two logs sharing the latest date', () => {
    const sore = makeSore();
    const a = makeLog({ sore_id: sore.id, log_date: '2026-01-05', pain: 2 });
    const b = makeLog({ sore_id: sore.id, log_date: '2026-01-05', pain: 8 });
    expect(latestLog([a, b])).toBe(a);
  });
});
