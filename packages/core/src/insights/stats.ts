/**
 * Small numeric helpers shared by the insights modules. Every function is
 * pure and returns null (never NaN) on empty input so callers can pass the
 * result straight into the contract's nullable fields.
 */

/** Round to 1 decimal; the contract's precision for durations, gaps and pains. */
export function round1(n: number): number {
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : n;
}

/** Round to 2 decimals; the contract's precision for rates and lift. Infinity stays Infinity. */
export function round2(n: number): number {
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : n;
}

/** Arithmetic mean, or null on empty input. */
export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/** Median (midpoint of the two middle values for even counts), or null on empty input. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Largest value, or null on empty input. */
export function max(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  let best = -Infinity;
  for (const v of values) if (v > best) best = v;
  return best;
}

/** Mean rounded to 1 decimal, or null on empty input. */
export function mean1(values: readonly number[]): number | null {
  const m = mean(values);
  return m === null ? null : round1(m);
}

/** Median rounded to 1 decimal, or null on empty input. */
export function median1(values: readonly number[]): number | null {
  const m = median(values);
  return m === null ? null : round1(m);
}
