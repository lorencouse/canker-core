import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  importLastNight,
  nightEndFor,
  sleepImportSupported,
  sumAsleepHours
} from './health-sleep';

const mocks = vi.hoisted(() => ({
  native: true,
  platform: 'ios',
  available: new Set(['Health']),
  isAvailable: vi.fn(),
  requestAuthorization: vi.fn(),
  readSamples: vi.fn()
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => mocks.native,
    isPluginAvailable: (name: string) => mocks.available.has(name),
    getPlatform: () => mocks.platform
  }
}));

vi.mock('@capgo/capacitor-health', () => ({
  Health: {
    isAvailable: mocks.isAvailable,
    requestAuthorization: mocks.requestAuthorization,
    readSamples: mocks.readSamples
  }
}));

/** Local time on a fixed November night, so DST plays no part. */
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 10, day, hour, minute);

const seg = (start: Date, end: Date, stage: string) => ({ start, end, stage });

const granted = {
  readAuthorized: ['sleep'],
  readDenied: [],
  writeAuthorized: [],
  writeDenied: []
};

const WATCH = 'com.apple.health.watch';
const PHONE = 'com.apple.health.phone';

/** One HealthKit category sample, shaped the way the plugin returns it. */
const iosSample = (
  start: Date,
  end: Date,
  stage: string,
  sourceId = WATCH
) => ({
  dataType: 'sleep',
  sourceId,
  value: (end.getTime() - start.getTime()) / 60_000,
  unit: 'minute',
  startDate: start.toISOString(),
  endDate: end.toISOString(),
  sleepState: stage,
  stages: [
    {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      stage,
      durationMinutes: (end.getTime() - start.getTime()) / 60_000
    }
  ],
  hasStageData: true
});

beforeEach(() => {
  mocks.native = true;
  mocks.platform = 'ios';
  mocks.available = new Set(['Health']);
  vi.clearAllMocks();
  mocks.isAvailable.mockResolvedValue({ available: true });
  mocks.requestAuthorization.mockResolvedValue(granted);
  mocks.readSamples.mockResolvedValue({ samples: [] });
});

describe('sumAsleepHours', () => {
  const windowStart = at(5, 18);
  const windowEnd = at(6, 9);

  it('does not double-count overlapping segments', () => {
    // A watch and the phone both recorded the same night.
    const hours = sumAsleepHours(
      [
        seg(at(5, 23), at(6, 7), 'asleep'),
        seg(at(6, 0), at(6, 6), 'deep'),
        seg(at(6, 6, 30), at(6, 7, 30), 'rem')
      ],
      windowStart,
      windowEnd
    );
    expect(hours).toBe(8.5);
  });

  it('leaves out awake and in-bed time', () => {
    const hours = sumAsleepHours(
      [
        seg(at(5, 22), at(6, 7), 'inBed'),
        seg(at(5, 23), at(6, 3), 'light'),
        seg(at(6, 3), at(6, 4), 'awake'),
        seg(at(6, 4), at(6, 6), 'rem')
      ],
      windowStart,
      windowEnd
    );
    expect(hours).toBe(6);
  });

  it('clips a segment that crosses the start of the window', () => {
    const hours = sumAsleepHours(
      [seg(at(5, 16), at(5, 20), 'asleep')],
      windowStart,
      windowEnd
    );
    expect(hours).toBe(2);
  });

  it('clips a segment that runs past the end of the window', () => {
    const hours = sumAsleepHours(
      [seg(at(6, 8), at(6, 11), 'asleep')],
      windowStart,
      windowEnd
    );
    expect(hours).toBe(1);
  });

  it('ignores sleep entirely outside the window', () => {
    const hours = sumAsleepHours(
      [seg(at(5, 1), at(5, 8), 'asleep')],
      windowStart,
      windowEnd
    );
    expect(hours).toBe(0);
  });

  it('rounds 7h40m to 7.75', () => {
    const hours = sumAsleepHours(
      [seg(at(5, 23), at(6, 6, 40), 'asleep')],
      windowStart,
      windowEnd
    );
    expect(hours).toBe(7.75);
  });

  it('rounds to the nearest quarter hour', () => {
    expect(
      sumAsleepHours(
        [seg(at(5, 23), at(6, 6, 7), 'asleep')],
        windowStart,
        windowEnd
      )
    ).toBe(7);
    expect(
      sumAsleepHours(
        [seg(at(5, 23), at(6, 6, 8), 'asleep')],
        windowStart,
        windowEnd
      )
    ).toBe(7.25);
  });
});

describe('sleepImportSupported', () => {
  it('is true in an app version with the Health plugin', () => {
    expect(sleepImportSupported()).toBe(true);
  });

  it('is false on the web, where the plugin registers a web fallback', () => {
    mocks.native = false;
    expect(sleepImportSupported()).toBe(false);
  });

  it('is false in an app version without the Health plugin', () => {
    mocks.available = new Set();
    expect(sleepImportSupported()).toBe(false);
  });
});

describe('sleepImportAvailable', () => {
  // A fresh module each time: the answer is cached for the page's life.
  const fresh = async () => {
    vi.resetModules();
    return (await import('./health-sleep')).sleepImportAvailable;
  };

  it('asks the plugin once and reuses the answer', async () => {
    const sleepImportAvailable = await fresh();
    expect(await sleepImportAvailable()).toBe(true);
    expect(await sleepImportAvailable()).toBe(true);
    expect(mocks.isAvailable).toHaveBeenCalledTimes(1);
  });

  it('is false where Health Connect is not installed', async () => {
    const sleepImportAvailable = await fresh();
    mocks.platform = 'android';
    mocks.isAvailable.mockResolvedValue({ available: false });
    expect(await sleepImportAvailable()).toBe(false);
  });

  it('is true where the health store is present', async () => {
    const sleepImportAvailable = await fresh();
    expect(await sleepImportAvailable()).toBe(true);
  });

  it('is false without asking the plugin when import is unsupported', async () => {
    const sleepImportAvailable = await fresh();
    mocks.native = false;
    expect(await sleepImportAvailable()).toBe(false);
    expect(mocks.isAvailable).not.toHaveBeenCalled();
  });

  it('is false when the availability check fails', async () => {
    const sleepImportAvailable = await fresh();
    mocks.isAvailable.mockRejectedValue(new Error('boom'));
    expect(await sleepImportAvailable()).toBe(false);
  });
});

describe('nightEndFor', () => {
  const now = at(6, 8, 15);

  it('ends today at the check-in clock', () => {
    expect(nightEndFor('2026-11-06', now)).toEqual(now);
  });

  it('ends an earlier day at 14:00, before an afternoon nap', () => {
    expect(nightEndFor('2026-11-05', now)).toEqual(at(5, 14));
  });

  it("leaves that day's nap out of its night", () => {
    const end = nightEndFor('2026-11-05', now);
    const start = at(4, 18);
    expect(
      sumAsleepHours(
        [
          seg(at(4, 23), at(5, 7), 'asleep'),
          seg(at(5, 15), at(5, 16), 'asleep')
        ],
        start,
        end
      )
    ).toBe(8);
  });
});

describe('importLastNight', () => {
  const now = at(6, 8, 15);

  it('asks to read sleep only, and nothing to write', async () => {
    await importLastNight(now);
    expect(mocks.requestAuthorization).toHaveBeenCalledWith({
      read: ['sleep'],
      write: []
    });
  });

  it('reads from 18:00 the previous day up to now', async () => {
    await importLastNight(now);
    expect(mocks.readSamples).toHaveBeenCalledWith(
      expect.objectContaining({
        dataType: 'sleep',
        startDate: at(5, 18).toISOString(),
        endDate: now.toISOString()
      })
    );
  });

  it('returns null when permission is denied', async () => {
    mocks.platform = 'android';
    mocks.requestAuthorization.mockResolvedValue({
      ...granted,
      readAuthorized: [],
      readDenied: ['sleep']
    });
    expect(await importLastNight(now)).toBeNull();
    expect(mocks.readSamples).not.toHaveBeenCalled();
  });

  it('returns null when the permission request fails', async () => {
    mocks.requestAuthorization.mockRejectedValue(
      new Error('Authorization request was not granted.')
    );
    expect(await importLastNight(now)).toBeNull();
  });

  it('returns null when there is no sleep in the window', async () => {
    // HealthKit hides a refusal this way: the read succeeds, empty.
    expect(await importLastNight(now)).toBeNull();
  });

  it('returns null when only awake or in-bed time was recorded', async () => {
    mocks.readSamples.mockResolvedValue({
      samples: [iosSample(at(5, 23), at(6, 7), 'inBed')]
    });
    expect(await importLastNight(now)).toBeNull();
  });

  it('returns null and asks nothing when unsupported', async () => {
    mocks.native = false;
    expect(await importLastNight(now)).toBeNull();
    expect(mocks.requestAuthorization).not.toHaveBeenCalled();
  });

  it("takes the watch's staged night over the phone's estimate", async () => {
    mocks.readSamples.mockResolvedValue({
      samples: [
        iosSample(at(5, 22, 30), at(6, 6, 50), 'inBed'),
        iosSample(at(5, 23), at(6, 2), 'light'),
        iosSample(at(6, 2), at(6, 2, 20), 'awake'),
        iosSample(at(6, 2, 20), at(6, 6, 40), 'deep'),
        // The phone's own estimate covers the watch's awake gap; it must not
        // fill it in.
        iosSample(at(5, 23, 10), at(6, 6, 30), 'asleep', PHONE)
      ]
    });
    expect(await importLastNight(now)).toEqual({
      hours: 7.25,
      source: 'apple_health'
    });
  });

  it('uses a stage-less source when it is the only one', async () => {
    mocks.readSamples.mockResolvedValue({
      samples: [iosSample(at(5, 23, 10), at(6, 6, 30), 'asleep', PHONE)]
    });
    expect(await importLastNight(now)).toEqual({
      hours: 7.25,
      source: 'apple_health'
    });
  });

  it('takes the longer of two staged sources', async () => {
    mocks.readSamples.mockResolvedValue({
      samples: [
        iosSample(at(5, 23), at(6, 5), 'light'),
        iosSample(at(5, 23), at(6, 6), 'deep', 'com.example.ring'),
        // Longer, but stage-less, so it does not win.
        iosSample(at(5, 22), at(6, 7), 'asleep', PHONE)
      ]
    });
    expect(await importLastNight(now)).toEqual({
      hours: 7,
      source: 'apple_health'
    });
  });

  it('sums Health Connect stages as health_connect', async () => {
    mocks.platform = 'android';
    mocks.readSamples.mockResolvedValue({
      samples: [
        {
          dataType: 'sleep',
          value: 480,
          unit: 'minute',
          startDate: at(5, 23).toISOString(),
          endDate: at(6, 7).toISOString(),
          hasStageData: true,
          stages: [
            {
              startDate: at(5, 23).toISOString(),
              endDate: at(6, 3).toISOString(),
              stage: 'light',
              durationMinutes: 240
            },
            {
              startDate: at(6, 3).toISOString(),
              endDate: at(6, 4).toISOString(),
              stage: 'awake',
              durationMinutes: 60
            },
            {
              startDate: at(6, 4).toISOString(),
              endDate: at(6, 7).toISOString(),
              stage: 'rem',
              durationMinutes: 180
            }
          ]
        }
      ]
    });
    expect(await importLastNight(now)).toEqual({
      hours: 7,
      source: 'health_connect'
    });
  });

  it('counts a Health Connect session without stages as asleep', async () => {
    mocks.platform = 'android';
    mocks.readSamples.mockResolvedValue({
      samples: [
        {
          dataType: 'sleep',
          value: 450,
          unit: 'minute',
          startDate: at(5, 23, 30).toISOString(),
          endDate: at(6, 7).toISOString(),
          hasStageData: false
        }
      ]
    });
    expect(await importLastNight(now)).toEqual({
      hours: 7.5,
      source: 'health_connect'
    });
  });

  it('skips an Apple Health sample whose stage it does not know', async () => {
    mocks.readSamples.mockResolvedValue({
      samples: [
        {
          dataType: 'sleep',
          value: 480,
          unit: 'minute',
          startDate: at(5, 23).toISOString(),
          endDate: at(6, 7).toISOString(),
          hasStageData: false
        }
      ]
    });
    expect(await importLastNight(now)).toBeNull();
  });

  it('returns null when reading fails', async () => {
    mocks.readSamples.mockRejectedValue(new Error('SecurityException'));
    expect(await importLastNight(now)).toBeNull();
  });
});
