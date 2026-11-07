import { describe, expect, it } from 'vitest';

import {
  buildSaveDayLogSql,
  effectiveTriggers,
  emptyDayLog,
  isAnsweredClean
} from './day-log';

const base = emptyDayLog('2026-11-06');

describe('effectiveTriggers', () => {
  it('derives Stress from a stress of 4 or more only', () => {
    expect(effectiveTriggers({ ...base, stress: 4 })).toContain('Stress');
    expect(effectiveTriggers({ ...base, stress: 3 })).not.toContain('Stress');
  });

  it('derives Poor sleep from low quality or short hours', () => {
    expect(effectiveTriggers({ ...base, sleep_quality: 2 })).toContain('Poor sleep');
    expect(effectiveTriggers({ ...base, sleep_hours: 5.5 })).toContain('Poor sleep');
  });

  it('derives nothing from decent sleep', () => {
    expect(effectiveTriggers({ ...base, sleep_hours: 6, sleep_quality: 3 })).toEqual([]);
  });

  it('counts a legacy Stress tag and a derived one once', () => {
    const out = effectiveTriggers({ ...base, triggers: ['Stress'], stress: 5 });
    expect(out.filter((t) => t === 'Stress')).toHaveLength(1);
  });
});

describe('isAnsweredClean', () => {
  const answered = { ...base, food_answered: true, health_answered: true };

  it('is true when both are answered and nothing is effective', () => {
    expect(isAnsweredClean(answered)).toBe(true);
  });

  it('is false when health is unanswered, even with no triggers', () => {
    expect(isAnsweredClean({ ...answered, health_answered: false })).toBe(false);
  });

  it('is false when a derived trigger applies, and for a missing log', () => {
    expect(isAnsweredClean({ ...answered, stress: 5 })).toBe(false);
    expect(isAnsweredClean(undefined)).toBe(false);
  });
});

describe('buildSaveDayLogSql', () => {
  it('never touches the habit columns it does not own', () => {
    const sql = buildSaveDayLogSql();
    const update = sql.slice(sql.indexOf('do update set'));
    for (const col of ['sleep_hours', 'sleep_quality', 'sleep_source', 'stress']) {
      expect(sql).not.toContain(col);
      expect(update).not.toContain(col);
    }
    expect(update).toContain('triggers');
    expect(update).toContain('food_answered');
  });
});
