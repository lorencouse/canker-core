/**
 * The vocabulary for the daily log.
 *
 * Fixed lists rather than free tags, because the value of a trigger log is
 * counting: "spicy food" and "Spicy food" and "chilli" have to be the same
 * thing for the count to mean anything. The lists are the causes and
 * remedies that come up repeatedly in the aphthous-ulcer literature and in
 * dentists' advice; anything else goes in the day's note.
 */

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
