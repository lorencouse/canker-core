import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const plugin = vi.hoisted(() => ({
  cancel: vi.fn(async () => {}),
  schedule: vi.fn(async () => ({ notifications: [] })),
  checkPermissions: vi.fn(async () => ({ display: 'granted' })),
  requestPermissions: vi.fn(async () => ({ display: 'granted' }))
}));
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: plugin
}));
vi.mock('@/utils/native', () => ({ isNative: () => true }));

import {
  applyReminder,
  deferEveningReminder,
  readReminder,
  syncReminders
} from './reminders';
import { dayKey } from './days';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v)
    }
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const scheduled = () =>
  (
    plugin.schedule.mock.calls as unknown as Array<[{ notifications: any[] }]>
  ).map((c) => c[0].notifications[0]);

const batches = () =>
  (
    plugin.schedule.mock.calls as unknown as Array<[{ notifications: any[] }]>
  ).map((c) => c[0].notifications);

const EVENING_COPY = {
  title: 'Still time to check in',
  body: 'Log today in about a minute.',
  extra: { path: '/today?checkin=1' }
};
const DEFERRED_IDS = Array.from({ length: 14 }, (_, i) => 101 + i);
const EVENING_IDS = [1, ...DEFERRED_IDS].map((id) => ({ id }));

const repeating = (id: number, hour: number, minute: number) => ({
  id,
  ...EVENING_COPY,
  schedule: { on: { hour, minute }, allowWhileIdle: true }
});

/** One-shots at hour:minute on each of the 14 days after today, ids 101-114. */
const deferredRun = (hour: number, minute: number) => {
  const t = new Date();
  return DEFERRED_IDS.map((id, i) => ({
    id,
    ...EVENING_COPY,
    schedule: {
      at: new Date(
        t.getFullYear(),
        t.getMonth(),
        t.getDate() + 1 + i,
        hour,
        minute
      ),
      allowWhileIdle: true
    }
  }));
};

describe('reminders', () => {
  it('schedules the morning reminder with its copy and deep link', async () => {
    await applyReminder('morning', { enabled: true, time: '08:00' });
    expect(scheduled()).toEqual([
      expect.objectContaining({
        id: 2,
        title: 'Morning check-in',
        body: 'How are your sores today? About a minute.',
        schedule: { on: { hour: 8, minute: 0 }, allowWhileIdle: true },
        extra: { path: '/today?checkin=1' }
      })
    ]);
  });

  it('schedules the evening reminder as id 1 with its copy', async () => {
    await applyReminder('evening', { enabled: true, time: '20:00' });
    expect(scheduled()[0]).toMatchObject({
      id: 1,
      title: 'Still time to check in',
      body: 'Log today in about a minute.',
      extra: { path: '/today?checkin=1' }
    });
  });

  it('reads the existing evening key and per-slot defaults', () => {
    store.set(
      'canker-core:reminder',
      JSON.stringify({ enabled: true, time: '21:30' })
    );
    expect(readReminder('evening')).toEqual({ enabled: true, time: '21:30' });
    expect(readReminder('morning')).toEqual({ enabled: false, time: '08:00' });
    store.clear();
    expect(readReminder('evening')).toEqual({ enabled: false, time: '20:00' });
  });

  it('defers the evening reminder to a run of one-shots from tomorrow', async () => {
    await applyReminder('evening', { enabled: true, time: '20:00' });
    vi.clearAllMocks();
    await deferEveningReminder(dayKey(new Date()));
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: EVENING_IDS });
    expect(plugin.schedule).toHaveBeenCalledTimes(1);
    expect(batches()[0]).toEqual(deferredRun(20, 0));
    expect(store.get('canker-core:reminder-evening-deferred')).toBe(
      dayKey(new Date())
    );
  });

  it('leaves tonight alone when the check-in was for an earlier day', async () => {
    await applyReminder('evening', { enabled: true, time: '20:00' });
    vi.clearAllMocks();
    await deferEveningReminder('2000-01-01');
    expect(plugin.cancel).not.toHaveBeenCalled();
    expect(plugin.schedule).not.toHaveBeenCalled();
    expect(store.get('canker-core:reminder-evening-deferred')).toBeUndefined();
  });

  it('does nothing when the evening reminder is off', async () => {
    await deferEveningReminder(dayKey(new Date()));
    expect(plugin.cancel).not.toHaveBeenCalled();
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it('sync keeps the deferred run today, restores the daily repeat after', async () => {
    await applyReminder('evening', { enabled: true, time: '20:00' });
    await deferEveningReminder(dayKey(new Date()));
    vi.clearAllMocks();
    await syncReminders();
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: EVENING_IDS });
    expect(batches()).toEqual([deferredRun(20, 0)]);

    store.set('canker-core:reminder-evening-deferred', '2000-01-01');
    vi.clearAllMocks();
    await syncReminders();
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: EVENING_IDS });
    expect(batches()).toEqual([[repeating(1, 20, 0)]]);
  });

  it('a changed evening time keeps the skip, at the new time', async () => {
    await applyReminder('evening', { enabled: true, time: '20:00' });
    await deferEveningReminder(dayKey(new Date()));
    vi.clearAllMocks();
    await applyReminder('evening', { enabled: true, time: '21:30' });
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: EVENING_IDS });
    expect(batches()).toEqual([deferredRun(21, 30)]);
  });

  it('turning the evening reminder off cancels the deferred run too', async () => {
    await applyReminder('evening', { enabled: true, time: '20:00' });
    await deferEveningReminder(dayKey(new Date()));
    vi.clearAllMocks();
    await applyReminder('evening', { enabled: false, time: '20:00' });
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: EVENING_IDS });
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it('sync re-applies both enabled slots', async () => {
    store.set(
      'canker-core:reminder-morning',
      JSON.stringify({ enabled: true, time: '07:15' })
    );
    store.set(
      'canker-core:reminder',
      JSON.stringify({ enabled: true, time: '20:00' })
    );
    await syncReminders();
    expect(
      scheduled()
        .map((n) => n.id)
        .sort()
    ).toEqual([1, 2]);
  });

  it('restores the repeating schedule when deferring fails', async () => {
    await applyReminder('evening', { enabled: true, time: '20:00' });
    vi.clearAllMocks();
    plugin.schedule.mockRejectedValueOnce(new Error('boom'));
    await expect(deferEveningReminder(dayKey(new Date()))).rejects.toThrow(
      'boom'
    );
    expect(plugin.cancel).toHaveBeenLastCalledWith({
      notifications: EVENING_IDS
    });
    expect(batches().at(-1)).toEqual([repeating(1, 20, 0)]);
    expect(store.get('canker-core:reminder-evening-deferred')).toBeUndefined();
  });
});
