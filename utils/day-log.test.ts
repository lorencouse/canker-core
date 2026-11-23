import { describe, expect, it } from 'vitest';

import {
  buildSaveDayLogSql,
  effectiveTriggers,
  emptyDayLog,
  isAnsweredClean,
  POOR_SLEEP_QUALITY_UPTO,
  SHORT_SLEEP_UNDER_HOURS,
  STRESS_TRIGGER_FROM
} from './day-log';

const base = emptyDayLog('2026-11-06');

describe('effectiveTriggers', () => {
  // The check-in states these thresholds in words ("A 4 or 5 counts...",
  // "Under 6 hours, or a 2 or lower..."), so the copy and the rule agree.
  it('counts exactly what the check-in says it counts', () => {
    expect(STRESS_TRIGGER_FROM).toBe(4);
    expect(POOR_SLEEP_QUALITY_UPTO).toBe(2);
    expect(SHORT_SLEEP_UNDER_HOURS).toBe(6);
    expect(effectiveTriggers({ ...base, sleep_hours: 6 })).not.toContain('Poor sleep');
    expect(effectiveTriggers({ ...base, sleep_quality: 3 })).not.toContain('Poor sleep');
  });

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
