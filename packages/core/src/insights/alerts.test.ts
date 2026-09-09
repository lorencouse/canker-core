import type { Sore, SoreLog } from '../types';
import { computeAlerts } from './alerts';
import { summarizeSores } from './summaries';
import { makeLog, makeSore } from './fixtures';

const TODAY = '2026-06-30';

function alerts(sores: Sore[], logs: SoreLog[] = []) {
  return computeAlerts(summarizeSores(sores, logs, TODAY), sores, logs, [], TODAY);
}

describe('computeAlerts', () => {
  it('returns nothing for no sores', () => {
    expect(alerts([])).toEqual([]);
  });

  describe('long_running_sore', () => {
    it('flags an active sore open for more than LONG_SORE_DAYS', () => {
      const sore = makeSore({
        surface: 'cheek_left',
        onset_date: '2026-06-15',
        healed_date: null
      });
      const log = makeLog({ sore_id: sore.id, log_date: TODAY });
      expect(alerts([sore], [log])).toEqual([
        {
          kind: 'long_running_sore',
          sore_id: sore.id,
          message:
            'Your left cheek sore has been open for 16 days. Sores that last more than two weeks are worth showing a dentist or doctor.'
        }
      ]);
    });

    it('does not flag healed sores or sores open exactly two weeks', () => {
      const healed = makeSore({ onset_date: '2026-01-01', healed_date: '2026-01-25' });
      const fortnight = makeSore({ onset_date: '2026-06-17', healed_date: null });
      const log = makeLog({ sore_id: fortnight.id, log_date: TODAY });
      expect(alerts([healed, fortnight], [log])).toEqual([]);
    });

    it('describes the catch-all surface as just a sore', () => {
      const sore = makeSore({
        surface: 'other',
        onset_date: '2026-06-01',
        healed_date: null
      });
      const log = makeLog({ sore_id: sore.id, log_date: TODAY });
      expect(alerts([sore], [log])[0]?.message).toMatch(
        /^Your sore has been open for 30 days\./
      );
    });
  });

  describe('frequent_onsets', () => {
    it('fires at three onsets in the last 30 days', () => {
      const sores = ['2026-06-15', '2026-06-20', '2026-06-25'].map((onset_date) =>
        makeSore({ onset_date, healed_date: onset_date })
      );
      expect(alerts(sores)).toEqual([
        {
          kind: 'frequent_onsets',
          message:
            "You've had 3 new sores in the last 30 days. Frequent sores are worth mentioning to a clinician."
        }
      ]);
    });

    it('counts a 30-day window ending today, inclusive', () => {
      const inside = ['2026-06-01', '2026-06-20', TODAY].map((d) =>
        makeSore({ onset_date: d, healed_date: d })
      );
      expect(alerts(inside).map((a) => a.kind)).toEqual(['frequent_onsets']);
      const edge = ['2026-05-31', '2026-06-20', TODAY].map((d) =>
        makeSore({ onset_date: d, healed_date: d })
      );
      expect(alerts(edge)).toEqual([]);
    });
  });

  describe('no_log_today', () => {
    it('fires when an active sore has no log dated today', () => {
      const sore = makeSore({ onset_date: '2026-06-28', healed_date: null });
      expect(
        alerts([sore], [makeLog({ sore_id: sore.id, log_date: '2026-06-29' })])
      ).toEqual([
        { kind: 'no_log_today', message: "You haven't logged today's check-in yet." }
      ]);
    });

    it('stays quiet when any active sore was logged today', () => {
      const a = makeSore({ onset_date: '2026-06-28', healed_date: null });
      const b = makeSore({ onset_date: '2026-06-29', healed_date: null });
      expect(alerts([a, b], [makeLog({ sore_id: b.id, log_date: TODAY })])).toEqual([]);
    });

    it('ignores logs on healed sores and needs at least one active sore', () => {
      const healed = makeSore({ onset_date: '2026-06-20', healed_date: '2026-06-29' });
      const active = makeSore({ onset_date: '2026-06-28', healed_date: null });
      expect(
        alerts([healed, active], [makeLog({ sore_id: healed.id, log_date: TODAY })]).map(
          (a) => a.kind
        )
      ).toEqual(['no_log_today']);
      expect(alerts([healed])).toEqual([]);
    });
  });

  it('orders alerts long-running, frequent onsets, then missing check-in', () => {
    const sores = [
      makeSore({ onset_date: '2026-06-10', healed_date: null }),
      makeSore({ onset_date: '2026-06-20', healed_date: '2026-06-22' }),
      makeSore({ onset_date: '2026-06-25', healed_date: '2026-06-27' })
    ];
    expect(alerts(sores).map((a) => a.kind)).toEqual([
      'long_running_sore',
      'frequent_onsets',
      'no_log_today'
    ]);
  });
});
