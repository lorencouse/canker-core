import type { CheckIn, Sore } from '@/types';
import { addDays, dayKey } from '@/utils/readings';

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

/** The local day a habit screen's Today / Yesterday choice names. Steps the
 * calendar, not 24 hours, so a daylight-saving night cannot skip or repeat a day. */
export const resolveDay = (choice: 'today' | 'yesterday', now: Date): string =>
  dayKey(choice === 'today' ? now : addDays(now, -1));

export const shouldAutoStart = (checkIns: CheckIn[], today: string): boolean =>
  !checkIns.some((c) => c.day === today);

/**
 * The step after `current`. A sore added from the ask gets its own step
 * next, with the ask moved after it, so "Any new sores?" comes round again
 * once that sore is logged. Step keys stay unique, so a stored key always
 * names one step.
 */
export function nextStepAfter(
  steps: Step[],
  current: string,
  event: 'next' | 'added-sore',
  newSoreId?: string
): { steps: Step[]; current: string } {
  const i = steps.findIndex((s) => stepKey(s) === current);
  if (i === -1) return { steps, current };

  if (event === 'added-sore') {
    if (!newSoreId || steps[i].kind !== 'new-sore-ask') {
      return { steps, current };
    }
    const added: Step = { kind: 'sore', soreId: newSoreId };
    return {
      steps: [...steps.slice(0, i), added, ...steps.slice(i)],
      current: stepKey(added)
    };
  }

  const next = steps[i + 1];
  return { steps, current: next ? stepKey(next) : current };
}
