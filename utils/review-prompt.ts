import { dayKey } from '@/utils/days';
import { hasNativePlugin, isNative, platform } from '@/utils/native';

/**
 * The store's own rating prompt, asked for at most rarely.
 *
 * Only ever the system sheet (StoreKit on iOS, Play In-App Review on
 * Android), never a star dialog of our own: the OS decides whether it
 * actually appears and already caps it, so these rules are a stricter limit
 * on top of that, not a replacement for it. Asked only at the end of a good
 * check-in (components/check-in/FinishStep.tsx), never at launch, mid-task,
 * or after a failure.
 *
 * Per device, in localStorage, like the reminders: it is this phone's app
 * that was rated, and the web never asks.
 */

export const REVIEW_PROMPT_RULES = {
  /** Separate local days the app has been opened on before the first ask. */
  minDaysUsed: 3,
  /** Days between two asks, whatever the app version. */
  minDaysBetweenAsks: 120
} as const;

/** The App Store listing (in review until the iOS app is approved). */
export const APP_STORE_ID = '6834584957';
const WRITE_REVIEW_URL = {
  ios: `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`,
  android: 'https://play.google.com/store/apps/details?id=com.cankercore.app'
} as const;

export type ReviewPromptState = {
  /** Distinct local days the app was opened on, counted up to the minimum. */
  daysUsed: number;
  /** The last day counted, so a day is never counted twice. */
  lastDayUsed: string | null;
  /** When the prompt was last asked for, as epoch ms. */
  lastAskedAt: number | null;
  /** The app version it was last asked for in, which is never asked again. */
  lastAskedVersion: string | null;
};

const KEY = 'canker-core:review-prompt';
const DAY_MS = 24 * 60 * 60 * 1000;

export const EMPTY_STATE: ReviewPromptState = {
  daysUsed: 0,
  lastDayUsed: null,
  lastAskedAt: null,
  lastAskedVersion: null
};

/** Counts `day` as a day of use, once. */
export function recordDayUsed(
  state: ReviewPromptState,
  day: string
): ReviewPromptState {
  if (state.lastDayUsed === day) return state;
  return { ...state, daysUsed: state.daysUsed + 1, lastDayUsed: day };
}

export function isEligible(
  state: ReviewPromptState,
  now: Date,
  version: string
): boolean {
  if (state.daysUsed < REVIEW_PROMPT_RULES.minDaysUsed) return false;
  if (state.lastAskedVersion === version) return false;
  if (
    state.lastAskedAt !== null &&
    now.getTime() - state.lastAskedAt <
      REVIEW_PROMPT_RULES.minDaysBetweenAsks * DAY_MS
  )
    return false;
  return true;
}

export function recordAsked(
  state: ReviewPromptState,
  now: Date,
  version: string
): ReviewPromptState {
  return { ...state, lastAskedAt: now.getTime(), lastAskedVersion: version };
}

/** Anything malformed reads as a fresh install rather than throwing. */
export function parseState(raw: string | null): ReviewPromptState {
  if (!raw) return EMPTY_STATE;
  try {
    const p = JSON.parse(raw) as Partial<ReviewPromptState>;
    return {
      daysUsed:
        typeof p.daysUsed === 'number' && p.daysUsed >= 0 ? p.daysUsed : 0,
      lastDayUsed: typeof p.lastDayUsed === 'string' ? p.lastDayUsed : null,
      lastAskedAt: typeof p.lastAskedAt === 'number' ? p.lastAskedAt : null,
      lastAskedVersion:
        typeof p.lastAskedVersion === 'string' ? p.lastAskedVersion : null
    };
  } catch {
    return EMPTY_STATE;
  }
}

function read(): ReviewPromptState {
  try {
    return parseState(window.localStorage.getItem(KEY));
  } catch {
    return EMPTY_STATE;
  }
}

function write(state: ReviewPromptState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* no storage: the prompt simply never becomes eligible */
  }
}

const onStoreApp = () => isNative() && ['ios', 'android'].includes(platform());

/** Called once per launch in the app; a no-op on the web. */
export function noteAppUsed(now = new Date()) {
  if (!onStoreApp()) return;
  write(recordDayUsed(read(), dayKey(now)));
}

async function appVersion(): Promise<string> {
  if (!hasNativePlugin('App')) return 'unknown';
  const { App } = await import('@capacitor/app');
  // The marketing version, so a new TestFlight build of the same release
  // does not count as a new version.
  const { version } = await App.getInfo();
  return version;
}

/**
 * Asks the store for its rating sheet when this device is due one. Silent
 * on the web and in an app binary built before the plugin was added.
 */
export async function maybeAskForReview(now = new Date()) {
  if (!onStoreApp() || !hasNativePlugin('InAppReview')) return;
  try {
    const state = read();
    const version = await appVersion();
    if (!isEligible(state, now, version)) return;
    // Recorded before asking: the OS may show nothing and says nothing
    // either way, so an ask is what is throttled, not a shown sheet.
    write(recordAsked(state, now, version));
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
  } catch (error) {
    console.error('review prompt failed', error);
  }
}

/** The store page to write a review on, or null where there is none. */
export function writeReviewUrl(): string | null {
  if (!onStoreApp()) return null;
  return WRITE_REVIEW_URL[platform() as 'ios' | 'android'];
}
