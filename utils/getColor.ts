/**
 * Pain level -> colour.
 *
 * This ramp is the product's one piece of saturated colour: red means
 * severity and nothing else. The stops below are the same values declared as
 * --sev-1..--sev-10 in styles/main.css. They are duplicated here because
 * Konva paints to a canvas and cannot resolve CSS custom properties; keep the
 * two lists in step.
 */

type Ramp = { s: number; l: number };

// Light ground: a worse sore is the darker, more saturated mark.
const LIGHT: Ramp[] = [
  { s: 62, l: 88 },
  { s: 64, l: 82 },
  { s: 66, l: 77 },
  { s: 68, l: 71 },
  { s: 70, l: 66 },
  { s: 71, l: 60 },
  { s: 73, l: 55 },
  { s: 75, l: 49 },
  { s: 76, l: 44 },
  { s: 78, l: 38 }
];

// Dark ground: the direction inverts, so a mild sore recedes rather than
// glowing brighter than a severe one.
const DARK: Ramp[] = [
  { s: 30, l: 34 },
  { s: 38, l: 37 },
  { s: 45, l: 40 },
  { s: 52, l: 43 },
  { s: 58, l: 46 },
  { s: 64, l: 49 },
  { s: 70, l: 52 },
  { s: 76, l: 55 },
  { s: 82, l: 58 },
  { s: 88, l: 62 }
];

export const SEVERITY_MIN = 1;
export const SEVERITY_MAX = 10;

/** Colour for a pain level, clamped to the 1-10 scale. */
export function getSeverityColor(painLevel: number, isDark = false): string {
  const stops = isDark ? DARK : LIGHT;
  const index = Math.min(
    stops.length - 1,
    Math.max(0, Math.round(painLevel) - 1)
  );
  const { s, l } = stops[index];
  return `hsl(0, ${s}%, ${l}%)`;
}

/** Ink that stays legible on top of a given severity fill. */
export function getSeverityInk(painLevel: number, isDark = false): string {
  const stops = isDark ? DARK : LIGHT;
  const index = Math.min(
    stops.length - 1,
    Math.max(0, Math.round(painLevel) - 1)
  );
  // Matches --sev-ink-lo / --sev-ink-hi in styles/main.css.
  if (isDark) return 'hsl(0, 0%, 100%)';
  return stops[index].l > 58 ? 'hsl(212, 30%, 16%)' : 'hsl(0, 0%, 100%)';
}

/** @deprecated Use getSeverityColor, which is theme-aware. */
export const getColor = (painLevel: number) => getSeverityColor(painLevel);
