/**
 * Partial saves for the daily check-in.
 *
 * Each step of the check-in answers one question, so a save carries only that
 * step's fields and must leave the rest of the day's row alone. The merge is
 * pure so the server action can stay a thin transaction wrapper.
 */

import type { DayLog } from '@/types';
import {
  FOOD_TRIGGERS,
  HEALTH_TRIGGERS,
  TREATMENTS,
  TRIGGERS,
  emptyDayLog,
  pickKnown
} from '@/utils/day-log';

export type DayPatch = {
  sleep?: {
    hours: number | null;
    quality: number | null;
    source: DayLog['sleep_source'];
  };
  food?: string[];
  health?: { triggers: string[]; stress: number | null };
  treatments?: string[];
};

const SLEEP_SOURCES = ['manual', 'apple_health', 'health_connect'] as const;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** A whole number from 1 to 5, otherwise null. */
const scale = (v: unknown): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5 ? v : null;

/** Hours from 0 to 24, kept to the column's two decimals, otherwise null. */
const hours = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 24
    ? Math.round(v * 100) / 100
    : null;

/**
 * Parse an untrusted patch (a server action can be called with anything).
 * Out-of-range values become null and unknown tags are dropped; a malformed
 * section, or a patch with no sections at all, is refused with null.
 */
export function validatePatch(p: unknown): DayPatch | null {
  if (!isRecord(p)) return null;
  const out: DayPatch = {};

  if (p.sleep !== undefined) {
    if (!isRecord(p.sleep)) return null;
    const source = (SLEEP_SOURCES as readonly unknown[]).includes(
      p.sleep.source
    )
      ? (p.sleep.source as DayLog['sleep_source'])
      : null;
    out.sleep = {
      hours: hours(p.sleep.hours),
      quality: scale(p.sleep.quality),
      source
    };
  }
  if (p.food !== undefined) {
    if (!Array.isArray(p.food)) return null;
    out.food = pickKnown(p.food, FOOD_TRIGGERS);
  }
  if (p.health !== undefined) {
    if (!isRecord(p.health) || !Array.isArray(p.health.triggers)) return null;
    out.health = {
      triggers: pickKnown(p.health.triggers, HEALTH_TRIGGERS),
      stress: scale(p.health.stress)
    };
  }
  if (p.treatments !== undefined) {
    if (!Array.isArray(p.treatments)) return null;
    out.treatments = pickKnown(p.treatments, TREATMENTS);
  }

  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Replace the part of `existing` that belongs to `subset` with `chosen`,
 * keeping every other tag. Known tags come back in `TRIGGERS` order; unknown
 * legacy values follow them, as in `effectiveTriggers`.
 */
export function mergeTriggers(
  existing: string[],
  subset: readonly string[],
  chosen: string[]
): string[] {
  const kept = existing.filter((t) => !subset.includes(t));
  const all = new Set([...kept, ...chosen]);
  const known = TRIGGERS.filter((t) => all.has(t));
  const unknown = Array.from(all).filter(
    (t) => !(TRIGGERS as readonly string[]).includes(t)
  );
  return [...known, ...unknown];
}

/**
 * Fold a patch into the day's row (null when there is none yet). Answering
 * stress also clears a legacy `Stress` tag and recording sleep clears a legacy
 * `Poor sleep` tag, because both are now derived from the scales; a leftover
 * tag would keep counting after the user corrected the answer.
 */
export function applyPatch(
  existing: DayLog | null,
  day: string,
  patch: DayPatch
): DayLog {
  const log: DayLog = { ...(existing ?? emptyDayLog(day)), day };

  if (patch.sleep) {
    log.sleep_hours = patch.sleep.hours;
    log.sleep_quality = patch.sleep.quality;
    log.sleep_source = patch.sleep.source;
    log.triggers = log.triggers.filter((t) => t !== 'Poor sleep');
  }
  if (patch.food) {
    log.triggers = mergeTriggers(log.triggers, FOOD_TRIGGERS, patch.food);
    log.food_answered = true;
  }
  if (patch.health) {
    log.triggers = mergeTriggers(
      log.triggers,
      [...HEALTH_TRIGGERS, 'Stress'],
      patch.health.triggers
    );
    log.stress = patch.health.stress;
    log.health_answered = true;
  }
  if (patch.treatments) log.treatments = patch.treatments;

  return log;
}

/** True when the row holds nothing worth storing. */
export const isBlankDayLog = (log: DayLog): boolean =>
  log.triggers.length === 0 &&
  log.treatments.length === 0 &&
  log.note === null &&
  log.sleep_hours === null &&
  log.sleep_quality === null &&
  log.stress === null &&
  !log.food_answered &&
  !log.health_answered;
