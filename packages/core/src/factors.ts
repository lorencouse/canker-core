/** Mirrors the `factor_kind` Postgres enum. Order here is display order. */
export const FACTOR_KINDS = [
  'food',
  'medication',
  'treatment',
  'illness',
  'dental',
  'cycle',
  'other'
] as const;

export type FactorKind = (typeof FACTOR_KINDS)[number];

export const FACTOR_KIND_LABELS: Record<FactorKind, string> = {
  food: 'Food & drink',
  medication: 'Medication & supplements',
  treatment: 'Sore treatment',
  illness: 'Illness',
  dental: 'Mouth injury & dental',
  cycle: 'Cycle',
  other: 'Other'
};

/**
 * Kinds that could plausibly precede a sore. Treatments are excluded from
 * trigger analysis because they are a response to a sore, not a cause.
 */
export const TRIGGER_KINDS: readonly FactorKind[] = [
  'food',
  'medication',
  'illness',
  'dental',
  'cycle',
  'other'
];

export function isFactorKind(value: unknown): value is FactorKind {
  return typeof value === 'string' && (FACTOR_KINDS as readonly string[]).includes(value);
}

/**
 * Pseudo-factors derived from the scalar fields on a daily entry so the
 * trigger analysis can treat "poor sleep" and "high stress" like any other
 * logged factor. These ids never collide with database uuids.
 */
export const DERIVED_FACTORS = {
  poorSleep: {
    id: 'derived:poor_sleep',
    name: 'Poor sleep',
    kind: 'other' as FactorKind,
    /** sleep_quality at or below this counts as poor. Scale is 0..4. */
    threshold: 1
  },
  highStress: {
    id: 'derived:high_stress',
    name: 'High stress',
    kind: 'other' as FactorKind,
    /** stress at or above this counts as high. Scale is 0..4. */
    threshold: 3
  }
} as const;
