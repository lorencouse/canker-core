/**
 * The pain scale. Its colours live once, as --sev-1..--sev-10 in
 * styles/main.css, and resolve per theme; everything on screen reads them
 * through `sevFill`.
 */

export const SEVERITY_MIN = 1;
export const SEVERITY_MAX = 10;

/** The severity colour for a pain level; a level off the scale resolves to its nearest step. */
export const sevFill = (pain: number): string =>
  `hsl(var(--sev-${Math.min(SEVERITY_MAX, Math.max(SEVERITY_MIN, Math.round(pain)))}))`;
