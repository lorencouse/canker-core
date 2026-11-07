import { Capacitor } from '@capacitor/core';
import { Health, type HealthSample } from '@capgo/capacitor-health';

/**
 * Last night's sleep from Apple Health (iOS) or Health Connect (Android).
 *
 * Read-only and on request: permission is asked for the first time the person
 * taps import, never up front, and only the total hours leave this module.
 * Every failure, a refusal included, comes back as null, so the Sleep screen
 * shows one quiet line and stays manual.
 */

export type SleepSegment = { start: Date; end: Date; stage: string };
export type ImportedSleep = {
  hours: number;
  source: 'apple_health' | 'health_connect';
};

/** The plugin's stages that count as sleep; `awake` and `inBed` do not. */
const ASLEEP = new Set(['asleep', 'light', 'deep', 'rem']);

/** The plugin registers under this name (dist/esm/index.js). */
const PLUGIN = 'Health';

/** A night of raw stage segments from a watch is well under this. */
const SAMPLE_LIMIT = 1000;

/**
 * The plugin present in the native app. The native check comes first because
 * on the web the plugin registers a browser fallback, which makes
 * `isPluginAvailable` true there; an app version built before the plugin was
 * added has no native side for it, so it reads false.
 */
export const sleepImportSupported = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.isPluginAvailable(PLUGIN);

/**
 * Whether this phone has a health store to read: false on an Android phone
 * without Health Connect installed (Android 13 and older ship without it),
 * so the control is not offered where it could only fail.
 */
export async function sleepImportAvailable(): Promise<boolean> {
  if (!sleepImportSupported()) return false;
  try {
    return (await Health.isAvailable()).available;
  } catch {
    return false;
  }
}

/**
 * Hours asleep inside the window, to the nearest quarter hour. Segments are
 * clipped to the window and merged before summing, because an Apple Watch and
 * the iPhone (or two Android apps) can both record the same night.
 */
export function sumAsleepHours(
  segments: SleepSegment[],
  windowStart: Date,
  windowEnd: Date
): number {
  const from = windowStart.getTime();
  const to = windowEnd.getTime();
  const spans = segments
    .filter((s) => ASLEEP.has(s.stage))
    .map((s) => [
      Math.max(s.start.getTime(), from),
      Math.min(s.end.getTime(), to)
    ])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let open: number[] | null = null;
  for (const span of spans) {
    if (open && span[0] <= open[1]) {
      open[1] = Math.max(open[1], span[1]);
      continue;
    }
    if (open) total += open[1] - open[0];
    open = span;
  }
  if (open) total += open[1] - open[0];

  return Math.round((total / 3_600_000) * 4) / 4;
}

/**
 * One plugin sample as stage segments. HealthKit gives one sample per stage,
 * which the plugin repeats as a one-item `stages`; a sample whose stage it
 * cannot name has none and is skipped. A Health Connect sleep session lists
 * its stages when the writing app recorded them; a session without any is
 * time asleep as a whole.
 */
const segmentsOf = (sample: HealthSample, android: boolean): SleepSegment[] => {
  if (sample.stages?.length) {
    return sample.stages.map((s) => ({
      start: new Date(s.startDate),
      end: new Date(s.endDate),
      stage: s.stage
    }));
  }
  if (!android) return [];
  return [
    {
      start: new Date(sample.startDate),
      end: new Date(sample.endDate),
      stage: 'asleep'
    }
  ];
};

/**
 * Total time asleep in the night that ended by `now`: segments from 18:00 the
 * previous local day up to `now`. Asks to read sleep the first time; null on
 * refusal, no data, or any failure.
 *
 * HealthKit never says whether reading was refused (an app can only learn
 * that it asked), so on iOS a refusal arrives as an empty read. Health
 * Connect does say, and is not read at all then.
 */
export async function importLastNight(
  now: Date
): Promise<ImportedSleep | null> {
  if (!sleepImportSupported()) return null;
  const android = Capacitor.getPlatform() === 'android';
  const windowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    18
  );

  try {
    const status = await Health.requestAuthorization({
      read: ['sleep'],
      write: []
    });
    if (status.readDenied.includes('sleep')) return null;

    const { samples } = await Health.readSamples({
      dataType: 'sleep',
      startDate: windowStart.toISOString(),
      endDate: now.toISOString(),
      limit: SAMPLE_LIMIT,
      ascending: true
    });
    const hours = sumAsleepHours(
      samples.flatMap((s) => segmentsOf(s, android)),
      windowStart,
      now
    );
    if (hours <= 0) return null;
    return { hours, source: android ? 'health_connect' : 'apple_health' };
  } catch {
    return null;
  }
}
