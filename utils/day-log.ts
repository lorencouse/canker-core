/**
 * The vocabulary for the daily log.
 *
 * Fixed lists rather than free tags, because the value of a trigger log is
 * counting: "spicy food" and "Spicy food" and "chilli" have to be the same
 * thing for the count to mean anything. The lists are the causes and
 * remedies that come up repeatedly in the aphthous-ulcer literature and in
 * dentists' advice; anything else goes in the day's note.
 */

import type { DayLog } from '@/types';

/** A `day_logs` row as `DayLog`. Every read goes through it, so a column added here reaches both the screens and the check-in's read-then-rewrite. */
export const DAY_LOG_COLUMNS = `to_char(day, 'YYYY-MM-DD') as day, triggers, treatments, note,
  sleep_hours::float8 as sleep_hours, sleep_quality, sleep_source, stress,
  food_answered, health_answered`;

/** Whether untrusted input is shaped like a local YYYY-MM-DD day. */
export const isDayKey = (day: unknown): day is string =>
  typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day);

export const TRIGGERS = [
  'Stress',
  'Poor sleep',
  'Bit my cheek or lip',
  'Dental work',
  'Sharp or hard food',
  'Spicy food',
  'Acidic food',
  'Citrus',
  'Nuts',
  'Chocolate',
  'Coffee',
  'Alcohol',
  'Toothpaste with SLS',
  'Feeling ill',
  'Period'
] as const;

/** Triggers the check-in asks about under food. */
export const FOOD_TRIGGERS = [
  'Sharp or hard food',
  'Spicy food',
  'Acidic food',
  'Citrus',
  'Nuts',
  'Chocolate',
  'Coffee',
  'Alcohol'
] as const;

/** Triggers the check-in asks about under health. */
export const HEALTH_TRIGGERS = [
  'Feeling ill',
  'Period',
  'Bit my cheek or lip',
  'Dental work',
  'Toothpaste with SLS'
] as const;

export const TREATMENTS = [
  'Salt-water rinse',
  'Antiseptic mouthwash',
  'Numbing gel',
  'Steroid paste',
  'Protective paste',
  'Painkiller',
  'Vitamin B12',
  'Avoided trigger foods',
  'Soft foods only'
] as const;

/** A day with nothing recorded: no habits answered, no triggers or treatments. */
export const emptyDayLog = (day: string): DayLog => ({
  day,
  triggers: [],
  treatments: [],
  note: null,
  sleep_hours: null,
  sleep_quality: null,
  sleep_source: null,
  stress: null,
  food_answered: false,
  health_answered: false
});

export type Trigger = (typeof TRIGGERS)[number];
export type Treatment = (typeof TREATMENTS)[number];

/** Keep only known values, in list order, without duplicates. */
export const pickKnown = <T extends string>(
  values: unknown,
  known: readonly T[]
): T[] => {
  if (!Array.isArray(values)) return [];
  const set = new Set(values.filter((v): v is T => known.includes(v as T)));
  return known.filter((k) => set.has(k));
};

/**
 * Stored triggers plus the ones derived from the habit fields: a stress of
 * 4 or 5 is `Stress`; a sleep quality of 2 or less, or under 6 hours, is
 * `Poor sleep`. De-duplicated and in `TRIGGERS` order, with unknown legacy
 * values after the known ones.
 */
export const effectiveTriggers = (log: DayLog): string[] => {
  const set = new Set<string>(log.triggers);
  if (log.stress !== null && log.stress >= 4) set.add('Stress');
  if (
    (log.sleep_quality !== null && log.sleep_quality <= 2) ||
    (log.sleep_hours !== null && log.sleep_hours < 6)
  ) {
    set.add('Poor sleep');
  }
  const known = TRIGGERS.filter((t) => set.has(t));
  const unknown = log.triggers.filter(
    (t, i, all) => !(TRIGGERS as readonly string[]).includes(t) && all.indexOf(t) === i
  );
  return [...known, ...unknown];
};

/** A day where both questions were answered and nothing was ticked or derived. */
export const isAnsweredClean = (log: DayLog | undefined): boolean =>
  log !== undefined &&
  log.food_answered &&
  log.health_answered &&
  effectiveTriggers(log).length === 0;

/**
 * The statement behind `saveDayLog`. The update clause names only the
 * columns the form owns, so a save never clobbers sleep or stress that the
 * check-in or Health sync wrote; saving the form is an explicit answer to
 * both questions, so both answered flags are set.
 */
export const buildSaveDayLogSql = (): string => `insert into day_logs
  (user_id, day, triggers, treatments, note, food_answered, health_answered)
values ($1, $2, $3, $4, $5, true, true)
on conflict (user_id, day) do update set
  triggers        = excluded.triggers,
  treatments      = excluded.treatments,
  note            = excluded.note,
  food_answered   = true,
  health_answered = true`;
