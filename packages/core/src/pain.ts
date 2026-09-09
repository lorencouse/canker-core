/** Pain is 0..10. Size is millimetres, 1..30. */
export const PAIN_MIN = 0;
export const PAIN_MAX = 10;
export const SIZE_MIN_MM = 1;
export const SIZE_MAX_MM = 30;

/** Anchors shown under the pain slider so numbers mean the same thing on different days. */
export const PAIN_ANCHORS: ReadonlyArray<{ at: number; label: string }> = [
  { at: 0, label: 'No pain' },
  { at: 2, label: 'Noticeable if I look for it' },
  { at: 4, label: 'Hurts when eating' },
  { at: 6, label: 'Hurts when talking' },
  { at: 8, label: 'Hard to eat or sleep' },
  { at: 10, label: 'Worst imaginable' }
];

export function painAnchor(pain: number): string {
  let label = PAIN_ANCHORS[0]!.label;
  for (const a of PAIN_ANCHORS) if (pain >= a.at) label = a.label;
  return label;
}

/**
 * Bucket 0..10 pain into the five-step colour ramp used everywhere in the UI.
 * Returns 1..5. Healed sores use the separate "heal" colour, never this ramp.
 */
export function painBucket(pain: number): 1 | 2 | 3 | 4 | 5 {
  if (pain <= 2) return 1;
  if (pain <= 4) return 2;
  if (pain <= 6) return 3;
  if (pain <= 8) return 4;
  return 5;
}

/** Everyday reference objects for the size slider. */
export const SIZE_REFERENCES: ReadonlyArray<{ mm: number; label: string }> = [
  { mm: 1, label: 'pinhead' },
  { mm: 3, label: 'grain of rice' },
  { mm: 5, label: 'pencil eraser' },
  { mm: 8, label: 'pea' },
  { mm: 12, label: 'fingernail' },
  { mm: 20, label: 'dime' }
];

export function sizeReference(mm: number): string {
  let label = SIZE_REFERENCES[0]!.label;
  for (const r of SIZE_REFERENCES) if (mm >= r.mm) label = r.label;
  return label;
}

/** Sores open longer than this get a "see a clinician" flag. */
export const LONG_SORE_DAYS = 14;
