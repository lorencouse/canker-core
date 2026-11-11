import { isNative } from '@/utils/native';
import { dayKey } from '@/utils/days';

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
export const MORNING_TIME = DEFAULTS.morning;
// "Not now" on Today's offer; a choice like any other, so it never returns.
const OFFER_DISMISSED_KEY = 'canker-core:reminder-offer-dismissed';

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

/**
 * Whether this device has ever answered: a slot set either way in Settings
 * or onboarding, or the offer turned down. Both slots default to off, and the
 * onboarding step that offers one is shown once per account, so an account
 * onboarded before reminders existed, or a phone the app was later installed
 * on, would otherwise never be asked and never be reminded.
 */
function reminderChoiceMade(): boolean {
  try {
    return [...Object.values(KEYS), OFFER_DISMISSED_KEY].some(
      (key) => window.localStorage.getItem(key) !== null
    );
  } catch {
    // No storage means nothing to remember a yes or a no in; don't nag.
    return true;
  }
}

export function dismissReminderOffer() {
  try {
    window.localStorage.setItem(OFFER_DISMISSED_KEY, '1');
  } catch {
    /* the offer comes back next launch, which is the lesser harm */
  }
}

type Permission = 'granted' | 'denied' | 'prompt';

async function notificationPermission(): Promise<Permission> {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const { display } = await LocalNotifications.checkPermissions();
  return display === 'granted' || display === 'denied' ? display : 'prompt';
}

/**
 * What Today should say about reminders on this device:
 *   - `offer`: never asked here, so offer one.
 *   - `blocked`: a reminder is on but the phone does not allow the app's
 *     notifications, so none will arrive however it is scheduled.
 *   - `ok`: nothing to say (also on the web, which has no reminders).
 */
export async function reminderStatus(): Promise<'offer' | 'blocked' | 'ok'> {
  if (!remindersSupported()) return 'ok';
  if (!reminderChoiceMade()) return 'offer';
  const on = (['morning', 'evening'] as const).some(
    (slot) => readReminder(slot).enabled
  );
  if (!on) return 'ok';
  return (await notificationPermission()) === 'granted' ? 'ok' : 'blocked';
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

/*
 * A skipped evening is a run of one-shot nudges from tomorrow, not a repeat
 * that starts tomorrow: in @capacitor/local-notifications (7 and 8) `every` is
 * ignored once `at` is set, and both platforms repeat at the gap between
 * scheduling and `at`, so a "daily" repeat drifts. The run is bounded; any
 * launch on a later day replaces it with the plain daily repeat, and a
 * fortnight without opening the app is a fair point to stop nudging.
 */
const DEFERRED_RUN_DAYS = 14;
const DEFERRED_IDS = Array.from(
  { length: DEFERRED_RUN_DAYS },
  (_, i) => 101 + i
);

/** `time` ("HH:MM") on each of the days after today, local. */
function deferredRun(time: string): Date[] {
  const [hour, minute] = time.split(':').map(Number);
  const now = new Date();
  return DEFERRED_IDS.map(
    (_, i) =>
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1 + i,
        hour,
        minute
      )
  );
}

type LocalNotificationsPlugin =
  typeof import('@capacitor/local-notifications').LocalNotifications;

/** Every notification a slot may own, the evening's deferred run included. */
const slotIds = (slot: ReminderSlot) =>
  (slot === 'evening' ? [IDS.evening, ...DEFERRED_IDS] : [IDS[slot]]).map(
    (id) => ({ id })
  );

async function scheduleSlot(
  plugin: LocalNotificationsPlugin,
  slot: ReminderSlot,
  time: string,
  startTomorrow: boolean
) {
  const [hour, minute] = time.split(':').map(Number);
  const base = { ...COPY[slot], extra: { path: PATH } };
  await plugin.schedule({
    notifications: startTomorrow
      ? deferredRun(time).map((at, i) => ({
          id: DEFERRED_IDS[i],
          ...base,
          schedule: { at, allowWhileIdle: true }
        }))
      : [
          {
            id: IDS[slot],
            ...base,
            schedule: { on: { hour, minute }, allowWhileIdle: true }
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
  await LocalNotifications.cancel({ notifications: slotIds(slot) });

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
 *
 * Only while the phone allows notifications. Without that, applying would
 * either raise the system prompt at launch with nothing to explain it or,
 * once refused, quietly record the reminder as off, and the person would
 * never learn why they are not reminded. The preference is kept instead, so
 * Today can say what is wrong and the schedule comes back by itself the
 * next launch after notifications are allowed again.
 */
export async function syncReminders() {
  if (!remindersSupported()) return;
  if ((await notificationPermission()) !== 'granted') return;
  for (const slot of ['morning', 'evening'] as const) {
    const pref = readReminder(slot);
    if (pref.enabled) await applyReminder(slot, pref);
  }
}

/**
 * `day`'s check-in is done, so skip that evening's nudge: cancel the daily
 * repeat and schedule the deferred run from tomorrow. `day` is the day the
 * check-in opened on; finished after midnight, its evening has already
 * passed and tonight's nudge stays. A later launch's syncReminders
 * normalises it back to the plain repeating schedule.
 */
export async function deferEveningReminder(day: string) {
  if (!remindersSupported()) return;
  if (day !== dayKey(new Date())) return;
  const pref = readReminder('evening');
  if (!pref.enabled) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.cancel({ notifications: slotIds('evening') });
  try {
    await scheduleSlot(LocalNotifications, 'evening', pref.time, true);
  } catch (error) {
    // Don't leave the user with no evening nudge at all, or with half a run.
    await LocalNotifications.cancel({ notifications: slotIds('evening') });
    await scheduleSlot(LocalNotifications, 'evening', pref.time, false);
    throw error;
  }
  writeDeferredDay(day);
}

/**
 * Ask the phone again for the reminders that are already on, and schedule
 * them if it now says yes. Once refused, iOS shows no second prompt and
 * answers at once, so false means the person has to allow it in Settings.
 */
export async function allowReminderNotifications(): Promise<boolean> {
  if (!remindersSupported()) return false;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const { display } = await LocalNotifications.requestPermissions();
  if (display !== 'granted') return false;
  await syncReminders();
  return true;
}
