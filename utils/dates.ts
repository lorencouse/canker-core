/**
 * A date as words: "Oct 22", or "Jul 8, 2025" outside this year.
 *
 * `toLocaleDateString()` with no options prints 10/22/2026, which reads
 * as a code rather than a day and flips month and day between locales.
 * The month as a word is unambiguous everywhere.
 */
export function shortDate(date: Date, now: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' })
  });
}
