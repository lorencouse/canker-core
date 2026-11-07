const KEY = 'canker-core:check-in';

/** Stored step key for today's in-progress check-in, or null. Safe on the
 * server and when storage is blocked or holds junk. */
export function readProgress(today: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.day === today &&
      typeof parsed.step === 'string'
    ) {
      return parsed.step;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeProgress(today: string, key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ day: today, step: key }));
  } catch {
    // Storage blocked or full: resume is a convenience, not a requirement.
  }
}

export function clearProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // See writeProgress.
  }
}
