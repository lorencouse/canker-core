import type { CheckIn, Sore } from '@/types';

export type Step =
  | { kind: 'sore'; soreId: string }
  | { kind: 'new-sore-ask' }
  | { kind: 'sleep' }
  | { kind: 'food' }
  | { kind: 'health' }
  | { kind: 'treatments' }
  | { kind: 'finish' };

export type HabitKind = 'sleep' | 'food' | 'health' | 'treatments';

export const stepKey = (s: Step): string =>
  s.kind === 'sore' ? `sore:${s.soreId}` : s.kind;

/** Active sores first (oldest first), then the fixed habit screens. */
export function buildSteps(sores: Sore[]): Step[] {
  const active = sores
    .filter((s) => s.healed_at === null)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((s): Step => ({ kind: 'sore', soreId: s.id }));
  return [
    ...active,
    { kind: 'new-sore-ask' },
    { kind: 'sleep' },
    { kind: 'food' },
    { kind: 'health' },
    { kind: 'treatments' },
    { kind: 'finish' }
  ];
}

/** Sleep and treatments describe today; food and health describe yesterday,
 * unless the check-in is opened by hand from midday on. */
export function defaultDay(
  kind: HabitKind,
  now: Date,
  manual: boolean
): 'today' | 'yesterday' {
  if (manual && now.getHours() >= 12) return 'today';
  return kind === 'sleep' || kind === 'treatments' ? 'today' : 'yesterday';
}

export const shouldAutoStart = (checkIns: CheckIn[], today: string): boolean =>
  !checkIns.some((c) => c.day === today);
