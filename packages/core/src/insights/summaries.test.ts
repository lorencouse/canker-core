import { mostCommonSurface, summarize, summarizeSores } from './summaries';
import { computeFlareUps } from './flareUps';
import { buildDataset, makeEntry, makeLog, makeSore } from './fixtures';

const TODAY = '2026-06-30';

describe('summarizeSores', () => {
  it('counts a same-day heal as 1 day', () => {
    const sore = makeSore({ onset_date: '2026-03-01', healed_date: '2026-03-01' });
    expect(summarizeSores([sore], [], TODAY)[0]?.duration_days).toBe(1);
  });

  it('runs an active sore up to today inclusive', () => {
    const sore = makeSore({ onset_date: '2026-06-21', healed_date: null });
    expect(summarizeSores([sore], [], TODAY)[0]?.duration_days).toBe(10);
  });

  it('flags only active sores as long-running', () => {
    const active = makeSore({ onset_date: '2026-06-10', healed_date: null });
    const healed = makeSore({ onset_date: '2026-01-01', healed_date: '2026-01-21' });
    const exactlyTwoWeeks = makeSore({ onset_date: '2026-06-17', healed_date: null });
    const out = summarizeSores([active, healed, exactlyTwoWeeks], [], TODAY);
    const byId = new Map(out.map((s) => [s.sore_id, s]));
    expect(byId.get(active.id)).toMatchObject({
      duration_days: 21,
      is_long_running: true
    });
    expect(byId.get(healed.id)).toMatchObject({
      duration_days: 21,
      is_long_running: false
    });
    expect(byId.get(exactlyTwoWeeks.id)).toMatchObject({
      duration_days: 14,
      is_long_running: false
    });
  });

  it('aggregates peak pain, peak size and log count per sore', () => {
    const sore = makeSore({ onset_date: '2026-01-01', healed_date: '2026-01-04' });
    const other = makeSore({ onset_date: '2026-02-01', healed_date: '2026-02-04' });
    const logs = [
      makeLog({ sore_id: sore.id, log_date: '2026-01-01', pain: 2, size_mm: 3 }),
      makeLog({ sore_id: sore.id, log_date: '2026-01-02', pain: 6, size_mm: 5 }),
      makeLog({ sore_id: sore.id, log_date: '2026-01-03', pain: 4, size_mm: 4 })
    ];
    const out = summarizeSores([sore, other], logs, TODAY);
    expect(out[0]).toMatchObject({
      sore_id: sore.id,
      peak_pain: 6,
      peak_size_mm: 5,
      log_count: 3
    });
    expect(out[1]).toMatchObject({
      sore_id: other.id,
      peak_pain: null,
      peak_size_mm: null,
      log_count: 0
    });
  });
});

describe('summarize', () => {
  function dataset() {
    const s1 = makeSore({
      onset_date: '2026-01-01',
      healed_date: '2026-01-02',
      surface: 'tongue_left'
    });
    const s2 = makeSore({
      onset_date: '2026-02-01',
      healed_date: '2026-02-04',
      surface: 'tongue_left'
    });
    const s3 = makeSore({
      onset_date: '2026-03-01',
      healed_date: '2026-03-06',
      surface: 'lip_lower_inner'
    });
    const s4 = makeSore({
      onset_date: '2026-04-01',
      healed_date: '2026-04-20',
      surface: 'palate_hard'
    });
    const s5 = makeSore({
      onset_date: '2026-06-25',
      healed_date: null,
      surface: 'cheek_left'
    });
    return buildDataset({
      sores: [s1, s2, s3, s4, s5],
      soreLogs: [
        makeLog({ sore_id: s1.id, log_date: '2026-01-01', pain: 4 }),
        makeLog({ sore_id: s1.id, log_date: '2026-01-02', pain: 2 }),
        makeLog({ sore_id: s2.id, log_date: '2026-02-02', pain: 7 })
      ],
      dailyEntries: [
        makeEntry({ entry_date: '2026-01-02' }),
        makeEntry({ entry_date: '2026-01-05' })
      ]
    });
  }

  function run(data = dataset()) {
    const flares = computeFlareUps(data.sores, data.soreLogs, TODAY);
    const sores = summarizeSores(data.sores, data.soreLogs, TODAY);
    return summarize(data, sores, flares, TODAY);
  }

  it('counts sores by state', () => {
    expect(run()).toMatchObject({ total_sores: 5, active_sores: 1, healed_sores: 4 });
  });

  it('uses mean and midpoint median over healed sores only (even count)', () => {
    // healed durations 2, 4, 6, 20 -> mean 8, median (4+6)/2 = 5; the active sore is excluded
    expect(run()).toMatchObject({ mean_duration_days: 8, median_duration_days: 5 });
  });

  it('averages peak pain over sores with at least one log', () => {
    expect(run().mean_peak_pain).toBe(5.5);
  });

  it('counts distinct tracked days and spans onset/healed dates', () => {
    // logs 01-01, 01-02, 02-02; entries 01-02, 01-05 -> 4 distinct days
    expect(run()).toMatchObject({
      days_tracked: 4,
      first_date: '2026-01-01',
      last_date: '2026-06-25'
    });
  });

  it('reports the current flare day for an active flare-up', () => {
    expect(run().current_flare_day).toBe(6);
  });

  it('reports the mean gap between flare-up starts', () => {
    // starts 01-01, 02-01, 03-01, 04-01, 06-25 -> gaps 31, 28, 31, 85 -> mean 43.75 -> 43.8
    expect(run().mean_gap_days).toBe(43.8);
  });

  it('picks the most common surface with its count', () => {
    expect(run()).toMatchObject({
      most_common_surface: 'tongue_left',
      most_common_surface_count: 2
    });
  });

  it('breaks surface ties by SORE_SURFACES order', () => {
    const data = buildDataset({
      sores: [
        makeSore({
          onset_date: '2026-01-01',
          healed_date: '2026-01-03',
          surface: 'palate_hard'
        }),
        makeSore({
          onset_date: '2026-02-01',
          healed_date: '2026-02-03',
          surface: 'lip_lower_inner'
        })
      ]
    });
    expect(run(data)).toMatchObject({
      most_common_surface: 'lip_lower_inner',
      most_common_surface_count: 1
    });
    expect(
      mostCommonSurface([{ surface: 'gum_lower' }, { surface: 'cheek_right' }])
    ).toEqual({
      surface: 'cheek_right',
      count: 1
    });
    expect(mostCommonSurface([])).toBeNull();
  });

  it('returns nulls and zeros for an empty dataset', () => {
    expect(run(buildDataset())).toEqual({
      total_sores: 0,
      active_sores: 0,
      healed_sores: 0,
      days_tracked: 0,
      first_date: null,
      last_date: null,
      mean_duration_days: null,
      median_duration_days: null,
      mean_peak_pain: null,
      mean_gap_days: null,
      most_common_surface: null,
      most_common_surface_count: 0,
      current_flare_day: null
    });
  });
});
