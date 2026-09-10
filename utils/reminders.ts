import { isNative } from '@/utils/native';

/**
 * The daily reminder.
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

const KEY = 'canker-core:reminder';
const NOTIFICATION_ID = 1;
export const DEFAULT_TIME = '20:00';

export const remindersSupported = () => isNative();

export function readReminder(): ReminderPref {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ReminderPref>;
      if (typeof parsed.enabled === 'boolean' && /^\d{2}:\d{2}$/.test(parsed.time ?? ''))
        return { enabled: parsed.enabled, time: parsed.time! };
    }
  } catch {
    /* no storage: fall through to the default */
  }
  return { enabled: false, time: DEFAULT_TIME };
}

function writeReminder(pref: ReminderPref) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(pref));
  } catch {
    /* nothing to do; the schedule itself still took */
  }
}

/**
 * Apply a preference: schedule or cancel the notification, then remember
 * it. Returns false when permission was refused, so the switch can fall
 * back to off.
 */
export async function applyReminder(pref: ReminderPref): Promise<boolean> {
  if (!remindersSupported()) {
    writeReminder(pref);
    return true;
  }
  const { LocalNotifications } = await import('@capacitor/local-notifications');

  // Replace rather than stack: one reminder, at the latest chosen time.
  await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });

  if (pref.enabled) {
    let { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') display = (await LocalNotifications.requestPermissions()).display;
    if (display !== 'granted') {
      writeReminder({ ...pref, enabled: false });
      return false;
    }
    const [hour, minute] = pref.time.split(':').map(Number);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID,
          title: 'How are your sores today?',
          body: 'Log today’s size and pain. It takes a few seconds.',
          schedule: { on: { hour, minute }, allowWhileIdle: true },
          // Deep link: NativeBridge routes taps here.
          extra: { path: '/today' }
        }
      ]
    });
  }

  writeReminder(pref);
  return true;
}

/** Re-assert the stored schedule; safe to call on every launch. */
export async function syncReminder() {
  if (!remindersSupported()) return;
  const pref = readReminder();
  if (pref.enabled) await applyReminder(pref);
}
