/**
 * Width readings and the ruler that enters them. A width moves in half
 * millimetres, which is as fine as anyone can judge one, from 0.5mm up to
 * 20mm for the rare major ulcer.
 */
export const WIDTH_STEP = 0.5;
export const WIDTH_MIN = 0.5;
export const WIDTH_MAX = 20;

/** The nearest width a reading can hold. */
export const clampWidth = (mm: number): number =>
  Math.min(
    WIDTH_MAX,
    Math.max(WIDTH_MIN, Math.round(mm / WIDTH_STEP) * WIDTH_STEP)
  );

/** Which tick of the ruler, counting from 0 at the narrowest, a width sits on. */
export const rulerIndex = (mm: number): number =>
  Math.round((clampWidth(mm) - WIDTH_MIN) / WIDTH_STEP);

/** The width at a tick; ticks past either end read as that end. */
export const rulerValue = (index: number): number =>
  clampWidth(WIDTH_MIN + Math.round(index) * WIDTH_STEP);

/** Kanko's face over the pain slider: calm 1-3, uneasy 4-6, ouch 7-10. */
export const painMood = (
  pain: number
): 'pain-calm' | 'pain-uneasy' | 'pain-ouch' =>
  pain <= 3 ? 'pain-calm' : pain <= 6 ? 'pain-uneasy' : 'pain-ouch';
