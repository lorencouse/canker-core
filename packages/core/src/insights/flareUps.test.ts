import { computeFlareUps } from './flareUps';
import { makeLog, makeSore } from './fixtures';

const TODAY = '2026-06-30';

describe('computeFlareUps', () => {
  it('returns nothing for no sores', () => {
    expect(computeFlareUps([], [], TODAY)).toEqual([]);
  });

  it('merges two overlapping sores into one flare-up', () => {
    const s1 = makeSore({ onset_date: '2026-01-01', healed_date: '2026-01-05' });
    const s2 = makeSore({ onset_date: '2026-01-03', healed_date: '2026-01-08' });
    const flares = computeFlareUps([s2, s1], [], TODAY);
    expect(flares).toHaveLength(1);
    expect(flares[0]).toMatchObject({
      started_on: '2026-01-01',
      ended_on: '2026-01-08',
      days: 8,
      is_active: false,
      sore_ids: [s1.id, s2.id],
      peak_pain: null
    });
  });

  it('merges sores on consecutive days into one flare-up', () => {
    const s1 = makeSore({ onset_date: '2026-01-01', healed_date: '2026-01-05' });
    const s2 = makeSore({ onset_date: '2026-01-06', healed_date: '2026-01-07' });
    const flares = computeFlareUps([s1, s2], [], TODAY);
    expect(flares).toHaveLength(1);
    expect(flares[0]).toMatchObject({
      started_on: '2026-01-01',
      ended_on: '2026-01-07',
      days: 7
    });
  });

  it('splits on a one-day gap into two flare-ups', () => {
    const s1 = makeSore({ onset_date: '2026-01-01', healed_date: '2026-01-05' });
    const s2 = makeSore({ onset_date: '2026-01-07', healed_date: '2026-01-08' });
    const flares = computeFlareUps([s1, s2], [], TODAY);
    expect(flares).toHaveLength(2);
    expect(flares[0]).toMatchObject({
      started_on: '2026-01-01',
      ended_on: '2026-01-05',
      days: 5,
      sore_ids: [s1.id]
    });
    expect(flares[1]).toMatchObject({
      started_on: '2026-01-07',
      ended_on: '2026-01-08',
      days: 2,
      sore_ids: [s2.id]
    });
  });

  it('is active when it reaches today and a sore is still open', () => {
    const open = makeSore({ onset_date: '2026-06-25', healed_date: null });
    const flares = computeFlareUps([open], [], TODAY);
    expect(flares[0]).toMatchObject({ ended_on: TODAY, days: 6, is_active: true });
  });

  it('is not active when every sore healed, even if it healed today', () => {
    const healedToday = makeSore({ onset_date: '2026-06-25', healed_date: TODAY });
    const flares = computeFlareUps([healedToday], [], TODAY);
    expect(flares[0]).toMatchObject({ ended_on: TODAY, is_active: false });
  });

  it('takes peak_pain from logs of its sores dated inside the range only', () => {
    const s1 = makeSore({ onset_date: '2026-01-01', healed_date: '2026-01-05' });
    const s2 = makeSore({ onset_date: '2026-02-01', healed_date: '2026-02-03' });
    const logs = [
      makeLog({ sore_id: s1.id, log_date: '2026-01-02', pain: 4 }),
      makeLog({ sore_id: s1.id, log_date: '2026-01-04', pain: 7 }),
      makeLog({ sore_id: s1.id, log_date: '2026-01-10', pain: 9 })
    ];
    const flares = computeFlareUps([s1, s2], logs, TODAY);
    expect(flares[0]?.peak_pain).toBe(7);
    expect(flares[1]?.peak_pain).toBeNull();
  });
});
