import type { UserDataset } from '../types';
import type { Insights, InsightsOptions } from './types';
import { computeAlerts } from './alerts';
import { computeFlareUps } from './flareUps';
import { computeRhythm } from './rhythm';
import { summarize, summarizeSores } from './summaries';
import { computeTreatmentOutcomes } from './treatments';
import { computeTriggerLift } from './triggers';

export type * from './types';
export {
  computeAlerts,
  FREQUENT_ONSET_THRESHOLD,
  FREQUENT_ONSET_WINDOW_DAYS
} from './alerts';
export { computeFlareUps } from './flareUps';
export { computeRhythm } from './rhythm';
export { mostCommonSurface, summarize, summarizeSores } from './summaries';
export {
  computeTreatmentOutcomes,
  NO_TREATMENT_ID,
  NO_TREATMENT_NAME
} from './treatments';
export { computeTriggerLift, type TriggerAnalysis } from './triggers';
export {
  DEFAULT_MIN_FACTOR_HITS,
  DEFAULT_MIN_ONSETS_FOR_TRIGGERS,
  DEFAULT_MIN_SORES_PER_TREATMENT,
  DEFAULT_TRIGGER_WINDOW,
  type InsightsTuning,
  soreDurationDays
} from './shared';
export { mean, median, round1, round2 } from './stats';

/** Run every insight over one dataset. Pure and deterministic for a given `options.today`. */
export function computeInsights(data: UserDataset, options: InsightsOptions): Insights {
  const { today, ...tuning } = options;

  const flare_ups = computeFlareUps(data.sores, data.soreLogs, today);
  const sores = summarizeSores(data.sores, data.soreLogs, today);
  const summary = summarize(data, sores, flare_ups, today);
  const { triggers, triggers_ready, onsets_until_triggers } = computeTriggerLift(
    data,
    today,
    tuning
  );
  const treatments = computeTreatmentOutcomes(data, today, tuning);
  const rhythm = computeRhythm(flare_ups);
  const alerts = computeAlerts(
    sores,
    data.sores,
    data.soreLogs,
    data.dailyEntries,
    today
  );

  return {
    summary,
    sores,
    flare_ups,
    triggers,
    triggers_ready,
    onsets_until_triggers,
    treatments,
    rhythm,
    alerts
  };
}
