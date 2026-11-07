import { beforeEach, describe, expect, it, vi } from 'vitest';

const plugin = vi.hoisted(() => ({
  cancel: vi.fn(async () => {}),
  schedule: vi.fn(async () => ({ notifications: [] })),
  checkPermissions: vi.fn(async () => ({ display: 'granted' })),
  requestPermissions: vi.fn(async () => ({ display: 'granted' }))
}));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: plugin }));
vi.mock('@/utils/native', () => ({ isNative: () => true }));

import {
  applyReminder,
  deferEveningReminder,
  readReminder,
  syncReminders
} from './reminders';
import { dayKey } from './readings';

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

const scheduled = () =>
  (plugin.schedule.mock.calls as unknown as Array<[{ notifications: any[] }]>).map(
    (c) => c[0].notifications[0]
  );

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
    store.set('canker-core:reminder', JSON.stringify({ enabled: true, time: '21:30' }));
    expect(readReminder('evening')).toEqual({ enabled: true, time: '21:30' });
    expect(readReminder('morning')).toEqual({ enabled: false, time: '08:00' });
    store.clear();
    expect(readReminder('evening')).toEqual({ enabled: false, time: '20:00' });
  });

  it('defers the evening reminder to tomorrow at its time', async () => {
    await applyReminder('evening', { enabled: true, time: '20:00' });
    vi.clearAllMocks();
    await deferEveningReminder();
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: [{ id: 1 }] });
    const at: Date = scheduled()[0].schedule.at;
    const t = new Date();
    const tomorrow = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1, 20, 0);
    expect(at.getTime()).toBe(tomorrow.getTime());
    expect(scheduled()[0].id).toBe(1);
  });

  it('does nothing when the evening reminder is off', async () => {
    await deferEveningReminder();
    expect(plugin.cancel).not.toHaveBeenCalled();
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it('sync keeps a deferred one-shot today, restores repeating after', async () => {
    await applyReminder('evening', { enabled: true, time: '20:00' });
    await deferEveningReminder();
    vi.clearAllMocks();
    await syncReminders();
    expect(scheduled()[0].schedule.at).toBeInstanceOf(Date);

    store.set('canker-core:reminder-evening-deferred', '2000-01-01');
    vi.clearAllMocks();
    await syncReminders();
    expect(scheduled()[0].schedule).toEqual({
      on: { hour: 20, minute: 0 },
      allowWhileIdle: true
    });
    expect(store.get('canker-core:reminder-evening-deferred')).not.toBe(dayKey(new Date()));
  });

  it('sync re-applies both enabled slots', async () => {
    store.set('canker-core:reminder-morning', JSON.stringify({ enabled: true, time: '07:15' }));
    store.set('canker-core:reminder', JSON.stringify({ enabled: true, time: '20:00' }));
    await syncReminders();
    expect(scheduled().map((n) => n.id).sort()).toEqual([1, 2]);
  });
});
