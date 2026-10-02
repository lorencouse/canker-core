import { z } from 'zod';

import type { Reading, Sore } from '@/types';
import { MOUTH_VIEWS } from '@/utils/mouth-map/geometry';

/**
 * Server-side checks for the `Sore[]` a client asks to save.
 *
 * The client is trusted for nothing but intent: these rows feed published
 * aggregates, so a sore off the map, a reading dated next week or two
 * readings on one day would land straight in public figures. Kept free of
 * server imports so it can be unit-tested beside utils/readings.ts.
 */

/** Generous: a client sends changed sores, or at most every sore it has. */
export const MAX_SORES_PER_SAVE = 500;
/** One reading per day, so this is years of a single sore. */
export const MAX_READINGS_PER_SORE = 1000;
/**
 * A device clock running slightly fast should not make a save fail, so
 * "not in the future" allows this much slack.
 */
export const CLOCK_SKEW_MS = 10 * 60_000;

const id = z.string().min(1).max(100);

const timestamp = (now: Date) =>
  z
    .string()
    // jsonb renders timestamptz with an offset, toISOString with a Z.
    .datetime({ offset: true })
    .refine(
      (s) => Date.parse(s) <= now.getTime() + CLOCK_SKEW_MS,
      'is in the future'
    );

const percent = z.number().finite().min(0).max(100).nullable();

const readingSchema = (now: Date) =>
  z.object({
    id,
    recorded_at: timestamp(now),
    // Out-of-range values are clamped on write, as they always were; only
    // something that is not a number at all is refused.
    size: z.number().finite(),
    pain: z.number().finite(),
    note: z.string().nullable().optional()
  });

const soreSchema = (now: Date) =>
  z.object({
    id,
    view: z.enum(MOUTH_VIEWS),
    x: percent,
    y: percent,
    zone: z.string(),
    created_at: timestamp(now),
    healed_at: timestamp(now).nullable(),
    readings: z.array(readingSchema(now)).max(MAX_READINGS_PER_SORE)
  });

export type ParsedSores =
  { ok: true; sores: Sore[] } | { ok: false; error: string };

/** Validate an untrusted save payload against the shape the database expects. */
export function parseSores(
  input: unknown,
  now: Date = new Date()
): ParsedSores {
  const result = z
    .array(soreSchema(now))
    .max(MAX_SORES_PER_SAVE)
    .safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      ok: false,
      error: `${issue.path.join('.') || 'sores'}: ${issue.message}`
    };
  }
  // user_id is deliberately not part of the schema; the session supplies it.
  return {
    ok: true,
    sores: result.data.map((s) => ({
      ...s,
      user_id: '',
      readings: s.readings.map((r) => ({ ...r, note: r.note ?? null }))
    }))
  };
}

/** Whether `timeZone` is an IANA zone this runtime can compute days in. */
export function isTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== 'string' || !timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** YYYY-MM-DD of `iso` in `timeZone`, the server's twin of `dayKey`. */
export const dayKeyIn = (iso: string, timeZone: string): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(iso));

/**
 * The first incoming reading that would give a sore a second reading on one
 * local day, or null.
 *
 * Only readings that are new, or whose date moved, are checked. Stored rows
 * were accepted when they were written; re-judging them in today's time zone
 * would lock someone who has travelled out of saving the sore at all. That
 * matches the client, which only ever corrects or appends the last reading,
 * deciding "same day" in the device's current zone.
 */
export function sameDayReading(
  readings: Reading[],
  stored: ReadonlyMap<string, string>,
  timeZone: string
): Reading | null {
  const days = readings.map((r) => dayKeyIn(r.recorded_at, timeZone));
  for (let i = 0; i < readings.length; i++) {
    const was = stored.get(readings[i].id);
    if (
      was !== undefined &&
      Date.parse(was) === Date.parse(readings[i].recorded_at)
    )
      continue;
    if (days.some((day, j) => j !== i && day === days[i])) return readings[i];
  }
  return null;
}
