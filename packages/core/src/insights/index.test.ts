import { computeInsights } from './index';
import { buildDataset, makeEntry, makeLog, makeSore } from './fixtures';

const TODAY = '2026-06-30';

describe('computeInsights', () => {
  it('returns a well-formed object for an empty dataset', () => {
    const out = computeInsights(buildDataset(), { today: TODAY });
    expect(out).toEqual({
      summary: {
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
      },
      sores: [],
      flare_ups: [],
      triggers: [],
      triggers_ready: false,
      onsets_until_triggers: 5,
      treatments: [],
      rhythm: {
        flare_starts: [],
        gaps_days: [],
        mean_gap_days: null,
        median_gap_days: null
      },
      alerts: []
    });
  });

  it('wires the sections together on a small dataset', () => {
    const healed = makeSore({ onset_date: '2026-06-01', healed_date: '2026-06-07' });
    const active = makeSore({ onset_date: '2026-06-27', healed_date: null });
    const data = buildDataset({
      sores: [healed, active],
      soreLogs: [makeLog({ sore_id: active.id, log_date: '2026-06-28', pain: 5 })],
      dailyEntries: [makeEntry({ entry_date: '2026-06-28' })]
    });
    const out = computeInsights(data, { today: TODAY });

    expect(out.summary).toMatchObject({
      total_sores: 2,
      active_sores: 1,
      healed_sores: 1,
      current_flare_day: 4
    });
    expect(out.sores.map((s) => s.sore_id)).toEqual([healed.id, active.id]);
    expect(out.flare_ups).toHaveLength(2);
    expect(out.flare_ups[1]).toMatchObject({ is_active: true, peak_pain: 5 });
    expect(out.rhythm.gaps_days).toEqual([26]);
    expect(out.triggers_ready).toBe(false);
    expect(out.onsets_until_triggers).toBe(3);
    expect(out.treatments).toEqual([
      {
        factor_id: 'none',
        name: 'No treatment',
        sores: 1,
        median_days_to_heal: 7,
        median_peak_pain: null
      }
    ]);
    expect(out.alerts.map((a) => a.kind)).toEqual(['no_log_today']);
  });

  it('respects option overrides', () => {
    const data = buildDataset({
      sores: [makeSore({ onset_date: '2026-06-01', healed_date: '2026-06-03' })]
    });
    const out = computeInsights(data, { today: TODAY, minOnsetsForTriggers: 1 });
    expect(out.triggers_ready).toBe(true);
    expect(out.onsets_until_triggers).toBe(0);
  });
});
