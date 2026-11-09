import type { CheckIn, Sore } from '@/types';
import { MOUTH_VIEWS } from '@/utils/mouth-map/geometry';
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

/**
 * Active sores first, then the fixed habit screens. Sores are grouped by the
 * map view they sit on (front, cheeks, lips) and oldest first within a view,
 * so the pinned map changes view as few times as it can.
 */
export function buildSteps(sores: Sore[]): Step[] {
  const viewRank = (s: Sore) => MOUTH_VIEWS.indexOf(s.view);
  const active = sores
    .filter((s) => s.healed_at === null)
    .sort(
      (a, b) =>
        viewRank(a) - viewRank(b) || a.created_at.localeCompare(b.created_at)
    )
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

/**
 * The day a habit screen opens on: yesterday for a morning check-in, since
 * the day being looked back on is the one just gone, and today from midday
 * on. Sleep is not asked this way; it is always last night.
 */
export function defaultDay(now: Date): 'today' | 'yesterday' {
  return now.getHours() < 12 ? 'yesterday' : 'today';
}

/** The local day a habit screen's Today / Yesterday choice names. Steps the
 * calendar, not 24 hours, so a daylight-saving night cannot skip or repeat a day. */
export const resolveDay = (choice: 'today' | 'yesterday', now: Date): string =>
  dayKey(choice === 'today' ? now : addDays(now, -1));

export const shouldAutoStart = (checkIns: CheckIn[], today: string): boolean =>
  !checkIns.some((c) => c.day === today);

/** The step after `current`, or `current` itself on the last or an unknown step. */
export function nextStepAfter(steps: Step[], current: string): string {
  const i = steps.findIndex((s) => stepKey(s) === current);
  const next = i === -1 ? undefined : steps[i + 1];
  return next ? stepKey(next) : current;
}
