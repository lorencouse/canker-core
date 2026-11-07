'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/Toasts/use-toast';
import type { DayLog, Sore } from '@/types';
import { saveDayPatch, setCheckInStatus } from '@/utils/actions/checkInActions';
import { applyPatchToLogs, type DayPatch } from '@/utils/check-in/patch';
import {
  clearProgress,
  readProgress,
  writeProgress
} from '@/utils/check-in/progress';
import {
  buildSteps,
  defaultDay,
  nextStepAfter,
  stepKey,
  type Step
} from '@/utils/check-in/steps';
import { notify, tap } from '@/utils/native';
import { dayKey } from '@/utils/readings';
import { deferEveningReminder } from '@/utils/reminders';

import FinishStep from './FinishStep';
import NewSoreAsk from './NewSoreAsk';
import SleepStep from './SleepStep';
import SoreStep from './SoreStep';
import StepHeading from './StepHeading';
import TagStep from './TagStep';

const STATUS_FAILED = 'Could not save your check-in. Try again.';

/**
 * The daily check-in: every open sore, then "Any new sores?", then the
 * habit screens, one full screen at a time.
 *
 * Each step writes its own answer as the user moves past it, so leaving
 * costs at most the screen they were on, and the step reached is kept on
 * this device so the next open today picks up there. Skip for today and
 * reaching the end are recorded on the server, which is what stops the
 * check-in starting again on any device.
 *
 * Mount it on the client only: the day and the resume point are read from
 * the device when it first renders. That clock is read once, so every write
 * in one check-in (readings, habits, the status) lands on the same day even
 * if it runs past midnight.
 */
export default function CheckInFlow({
  sores: initialSores,
  dayLogs,
  manual,
  onClose
}: {
  sores: Sore[];
  /** Recent day logs, so habit screens open on what is already saved. */
  dayLogs: DayLog[];
  /** Opened from the button rather than on its own; habit steps use it for their default day. */
  manual: boolean;
  onClose: (result: 'done' | 'skipped' | 'left') => void;
}) {
  const [now] = useState(() => new Date());
  const today = dayKey(now);
  // Sores and logs as this check-in has written them, including any added in it.
  const [sores, setSores] = useState(initialSores);
  const [logs, setLogs] = useState(dayLogs);
  const [steps, setSteps] = useState(() => buildSteps(initialSores));
  const [current, setCurrent] = useState(() => {
    const saved = readProgress(today);
    return saved && steps.some((s) => stepKey(s) === saved)
      ? saved
      : stepKey(steps[0]);
  });
  const [busy, setBusy] = useState(false);
  // A step's own save in flight; close and skip wait for it as for the flow's.
  const [stepBusy, setStepBusy] = useState(false);
  const locked = busy || stepBusy;

  useEffect(() => {
    // Finished is recorded on the server; there is nothing left to resume.
    if (current !== 'finish') writeProgress(today, current);
  }, [today, current]);

  const fail = (error: string) => {
    notify('error');
    toast({ variant: 'destructive', title: error });
  };

  const go = async (event: 'next' | 'added-sore', newSoreId?: string) => {
    const next = nextStepAfter(steps, current, event, newSoreId);
    if (next.current === 'finish' && current !== 'finish') {
      setBusy(true);
      try {
        const result = await setCheckInStatus(today, 'done');
        if (!result.ok) return fail(result.error);
        clearProgress();
        // Best-effort: a reminder problem never blocks or toasts the check-in.
        deferEveningReminder(today).catch((error) =>
          console.error('could not skip tonight’s reminder', error)
        );
      } catch {
        return fail(STATUS_FAILED);
      } finally {
        setBusy(false);
      }
    }
    setSteps(next.steps);
    setCurrent(next.current);
  };

  const skip = async () => {
    tap();
    setBusy(true);
    try {
      const result = await setCheckInStatus(today, 'skipped');
      if (!result.ok) return fail(result.error);
      clearProgress();
      onClose('skipped');
    } catch {
      fail(STATUS_FAILED);
    } finally {
      setBusy(false);
    }
  };

  /** One habit answer, written and then folded into the local logs. */
  const saveHabit = async (day: string, patch: DayPatch): Promise<boolean> => {
    try {
      const result = await saveDayPatch(day, patch);
      if (!result.ok) {
        fail(result.error);
        return false;
      }
    } catch {
      fail('Could not save that answer. Try again.');
      return false;
    }
    notify('success');
    setLogs((prev) => applyPatchToLogs(prev, day, patch));
    return true;
  };

  const habit = {
    logs,
    now,
    onSave: saveHabit,
    onBusy: setStepBusy,
    onNext: () => go('next')
  };

  const replaceSore = (next: Sore) =>
    setSores((prev) => prev.map((s) => (s.id === next.id ? next : s)));

  const step = steps.find((s) => stepKey(s) === current) ?? steps[0];
  const position = steps.indexOf(step) + 1;

  const renderStep = (step: Step) => {
    switch (step.kind) {
      case 'sore': {
        const sore = sores.find((s) => s.id === step.soreId);
        if (!sore) {
          return (
            <Placeholder
              title="This sore is gone"
              onNext={() => go('next')}
              busy={busy}
            />
          );
        }
        return (
          <SoreStep
            sore={sore}
            now={now}
            onBusy={setStepBusy}
            onChange={replaceSore}
            onNext={() => go('next')}
          />
        );
      }
      case 'new-sore-ask':
        return (
          <NewSoreAsk
            sores={sores}
            onAdded={(sore) => {
              setSores((prev) => [...prev, sore]);
              go('added-sore', sore.id);
            }}
            onNext={() => go('next')}
            onBusy={setStepBusy}
          />
        );
      case 'sleep':
        return (
          <SleepStep {...habit} initialDay={defaultDay('sleep', now, manual)} />
        );
      case 'food':
      case 'health':
      case 'treatments':
        return (
          <TagStep
            {...habit}
            kind={step.kind}
            initialDay={defaultDay(step.kind, now, manual)}
          />
        );
      case 'finish':
        return (
          <FinishStep
            sores={sores}
            logs={logs}
            now={now}
            onDone={() => onClose('done')}
          />
        );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Daily check-in"
      className="safe-t safe-b safe-x fixed inset-0 z-50 flex h-dvh flex-col bg-background"
    >
      <header className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 pt-2">
        <p className="tabular text-sm text-muted-foreground">
          {position} of {steps.length}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            step.kind === 'finish'
              ? 'Close the check-in'
              : 'Close the check-in and finish it later'
          }
          onClick={() => {
            tap();
            // On the last screen the day is already recorded as done.
            onClose(step.kind === 'finish' ? 'done' : 'left');
          }}
          disabled={locked}
        >
          <X aria-hidden="true" className="!size-5" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Keyed so each step starts fresh and its heading takes focus. */}
        <div key={current} className="mx-auto w-full max-w-lg px-4 py-4">
          {renderStep(step)}
        </div>
      </div>

      {step.kind !== 'finish' && (
        <footer className="mx-auto flex w-full max-w-lg justify-center px-4 pb-2">
          <Button
            type="button"
            variant="link"
            className="h-11 text-base text-muted-foreground"
            onClick={skip}
            disabled={locked}
          >
            Skip for today
          </Button>
        </footer>
      )}
    </div>
  );
}

/** A step with nothing to ask, such as a sore deleted elsewhere: its title and a way past it. */
function Placeholder({
  title,
  onNext,
  busy
}: {
  title: string;
  onNext: () => void;
  busy: boolean;
}) {
  return (
    <div className="grid gap-6">
      <StepHeading>{title}</StepHeading>
      <Button
        type="button"
        size="touch"
        className="w-full"
        disabled={busy}
        onClick={() => {
          tap();
          onNext();
        }}
      >
        {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
        Next
      </Button>
    </div>
  );
}
