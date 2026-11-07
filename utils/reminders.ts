import { isNative } from '@/utils/native';
import { dayKey } from '@/utils/readings';

/**
 * The daily reminders: a morning check-in and an evening nudge.
 *
 * A local notification scheduled on the device, not a push from the server:
 * there is nothing to say that the server knows and the phone does not, and
 * a local schedule keeps working with no connection. That also makes the
 * preference a per-device one, so it lives in localStorage rather than in
 * the database — a reminder on your phone says nothing about your laptop.
 *
 * On the web there is no way to schedule a notification for tomorrow, so
 * reminders are offered only inside the native app.
 */

export type ReminderPref = { enabled: boolean; time: string }; // "HH:MM"
export type ReminderSlot = 'morning' | 'evening';

// The evening key is the original single-reminder key, so existing users
// keep their setting.
const KEYS: Record<ReminderSlot, string> = {
  evening: 'canker-core:reminder',
  morning: 'canker-core:reminder-morning'
};
const IDS: Record<ReminderSlot, number> = { evening: 1, morning: 2 };
const DEFAULTS: Record<ReminderSlot, string> = {
  evening: '20:00',
  morning: '08:00'
};
const COPY: Record<ReminderSlot, { title: string; body: string }> = {
  morning: {
    title: 'Morning check-in',
    body: 'How are your sores today? About a minute.'
  },
  evening: {
    title: 'Still time to check in',
    body: 'Log today in about a minute.'
  }
};
// Deep link: NativeBridge routes taps here.
const PATH = '/today?checkin=1';
// The local day whose evening nudge was skipped because it was checked in.
const DEFERRED_KEY = 'canker-core:reminder-evening-deferred';

export const DEFAULT_TIME = DEFAULTS.evening;

export const remindersSupported = () => isNative();

export function readReminder(slot: ReminderSlot): ReminderPref {
  try {
    const raw = window.localStorage.getItem(KEYS[slot]);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ReminderPref>;
      if (
        typeof parsed.enabled === 'boolean' &&
        /^\d{2}:\d{2}$/.test(parsed.time ?? '')
      )
        return { enabled: parsed.enabled, time: parsed.time! };
    }
  } catch {
    /* no storage: fall through to the default */
  }
  return { enabled: false, time: DEFAULTS[slot] };
}

function writeReminder(slot: ReminderSlot, pref: ReminderPref) {
  try {
    window.localStorage.setItem(KEYS[slot], JSON.stringify(pref));
  } catch {
    /* nothing to do; the schedule itself still took */
  }
}

function readDeferredDay(): string | null {
  try {
    return window.localStorage.getItem(DEFERRED_KEY);
  } catch {
    return null;
  }
}

function writeDeferredDay(day: string) {
  try {
    window.localStorage.setItem(DEFERRED_KEY, day);
  } catch {
    /* worst case the nudge repeats tonight */
  }
}

/** The next time `time` ("HH:MM") occurs on the day after today, local. */
function tomorrowAt(time: string): Date {
  const [hour, minute] = time.split(':').map(Number);
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    hour,
    minute
  );
}

type LocalNotificationsPlugin =
  typeof import('@capacitor/local-notifications').LocalNotifications;

async function scheduleSlot(
  plugin: LocalNotificationsPlugin,
  slot: ReminderSlot,
  time: string,
  startTomorrow: boolean
) {
  const [hour, minute] = time.split(':').map(Number);
  await plugin.schedule({
    notifications: [
      {
        id: IDS[slot],
        ...COPY[slot],
        schedule: startTomorrow
          ? {
              at: tomorrowAt(time),
              repeats: true,
              every: 'day' as const,
              allowWhileIdle: true
            }
          : { on: { hour, minute }, allowWhileIdle: true },
        extra: { path: PATH }
      }
    ]
  });
}

/**
 * Apply a preference: schedule or cancel the notification, then remember
 * it. Returns false when permission was refused, so the switch can fall
 * back to off.
 */
export async function applyReminder(
  slot: ReminderSlot,
  pref: ReminderPref
): Promise<boolean> {
  if (!remindersSupported()) {
    writeReminder(slot, pref);
    return true;
  }
  const { LocalNotifications } = await import('@capacitor/local-notifications');

  // Replace rather than stack: one reminder per slot, at the latest time.
  await LocalNotifications.cancel({ notifications: [{ id: IDS[slot] }] });

  if (pref.enabled) {
    let { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted')
      display = (await LocalNotifications.requestPermissions()).display;
    if (display !== 'granted') {
      writeReminder(slot, { ...pref, enabled: false });
      return false;
    }
    // Checked in today: keep tonight's nudge skipped, whatever just changed.
    const startTomorrow =
      slot === 'evening' && readDeferredDay() === dayKey(new Date());
    await scheduleSlot(LocalNotifications, slot, pref.time, startTomorrow);
  }

  writeReminder(slot, pref);
  return true;
}

/**
 * Re-assert both stored schedules; safe to call on every launch. This also
 * restores the repeating evening schedule once the skipped day has passed.
 */
export async function syncReminders() {
  if (!remindersSupported()) return;
  for (const slot of ['morning', 'evening'] as const) {
    const pref = readReminder(slot);
    if (pref.enabled) await applyReminder(slot, pref);
  }
}

/**
 * Today's check-in is done, so skip tonight's evening nudge: cancel it and
 * schedule a daily repeat starting tomorrow. A later launch's syncReminders
 * normalises it back to the plain repeating schedule.
 */
export async function deferEveningReminder() {
  if (!remindersSupported()) return;
  const pref = readReminder('evening');
  if (!pref.enabled) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.cancel({ notifications: [{ id: IDS.evening }] });
  try {
    await scheduleSlot(LocalNotifications, 'evening', pref.time, true);
  } catch (error) {
    // Don't leave the user with no evening nudge at all.
    await scheduleSlot(LocalNotifications, 'evening', pref.time, false);
    throw error;
  }
  writeDeferredDay(dayKey(new Date()));
}
