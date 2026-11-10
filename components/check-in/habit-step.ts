import type { DayLog } from '@/types';
import type { DayPatch } from '@/utils/check-in/patch';

import type { DayChoice } from './DayToggle';

/** What every habit screen gets from the flow. */
export type HabitStepProps = {
  /** The day logs as this check-in has saved them. */
  logs: DayLog[];
  /** The check-in's clock, shared by every step. */
  now: Date;
  /** The day the screen opens on (`defaultDay`). */
  initialDay: DayChoice;
  /** Saves one answer; false when it failed and the error is already shown. */
  onSave: (day: string, patch: DayPatch) => Promise<boolean>;
  /** Moves on; it may write (the last screen records the check-in done), so the screen waits for it. */
  onNext: () => void | Promise<void>;
  /** Reports a save in flight, so the flow holds its close and skip. */
  onBusy?: (busy: boolean) => void;
};
