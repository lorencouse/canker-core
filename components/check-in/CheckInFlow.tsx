'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { useActionSheet } from '@/components/ui/action-sheet';
import { Button } from '@/components/ui/button';
import { useSheetDrag } from '@/components/ui/use-sheet-drag';
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
  isHabitStep,
  nextStepAfter,
  stepKey,
  type Step
} from '@/utils/check-in/steps';
import { notify, tap } from '@/utils/native';
import { cn } from '@/utils/cn';
import { currentPain, hasReadingOn, replaceSore } from '@/utils/readings';
import { dayKey } from '@/utils/days';
import { deferEveningReminder } from '@/utils/reminders';
import { sevFill } from '@/utils/severity';
import { runWrite, showFailure } from '@/utils/write-feedback';
import { BusyIcon } from '@/components/ui/busy-icon';

import FinishStep from './FinishStep';
import NewSoreAsk from './NewSoreAsk';
import SleepStep from './SleepStep';
import SoreStep from './SoreStep';
import StepHeading from './StepHeading';
import TagStep from './TagStep';

const STATUS_FAILED = 'Could not save your check-in. Try again.';

/**
 * The daily check-in: every open sore, then "Any new sores?", then the
 * habit screens, one at a time, in a sheet that rises over the app.
 *
 * It is a phone sheet: a grabber, swipe down to put it away (the same as
 * "Finish later"), a spring-like settle, and the safe areas kept. The close
 * button asks, as an action sheet, whether to finish later or skip the day,
 * so skipping is never one stray tap.
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
  onClose
}: {
  sores: Sore[];
  /** Recent day logs, so habit screens open on what is already saved. */
  dayLogs: DayLog[];
  onClose: (result: 'done' | 'skipped' | 'left') => void;
}) {
  const [now] = useState(() => new Date());
  const today = dayKey(now);
  // Sores and logs as this check-in has written them, including any added in it.
  const [sores, setSores] = useState(initialSores);
  const [logs, setLogs] = useState(dayLogs);
  const [steps] = useState(() => buildSteps(initialSores));
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

  const go = async () => {
    const next = nextStepAfter(steps, current);
    if (next === 'finish' && current !== 'finish') {
      setBusy(true);
      try {
        const result = await runWrite(
          () => setCheckInStatus(today, 'done'),
          STATUS_FAILED
        );
        if (!result.ok) return showFailure(result.error);
        clearProgress();
        // Best-effort: a reminder problem never blocks or toasts the check-in.
        deferEveningReminder(today).catch((error) =>
          console.error('could not skip tonight’s reminder', error)
        );
      } finally {
        setBusy(false);
      }
    }
    setCurrent(next);
  };

  const skip = async () => {
    tap();
    setBusy(true);
    try {
      const result = await runWrite(
        () => setCheckInStatus(today, 'skipped'),
        STATUS_FAILED
      );
      if (!result.ok) return showFailure(result.error);
      clearProgress();
      onClose('skipped');
    } finally {
      setBusy(false);
    }
  };

  /** One habit answer, written and then folded into the local logs. */
  const saveHabit = async (day: string, patch: DayPatch): Promise<boolean> => {
    const result = await runWrite(
      () => saveDayPatch(day, patch),
      'Could not save that answer. Try again.'
    );
    if (!result.ok) {
      showFailure(result.error);
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
    onNext: go
  };

  const step = steps.find((s) => stepKey(s) === current) ?? steps[0];
  const position = steps.indexOf(step);
  // The real count: every question, and not the "All logged" screen.
  const asked = steps.filter((s) => s.kind !== 'finish');
  const finished = step.kind === 'finish';

  const openSores = sores.filter((s) => !s.healed_at);
  const loggedToday = openSores.filter((s) => hasReadingOn(s, now));
  const activeSoreId = step.kind === 'sore' ? step.soreId : null;
  const doneIds = new Set(
    loggedToday.map((s) => s.id).filter((id) => id !== activeSoreId)
  );
  const soreSteps = steps.filter((s) => s.kind === 'sore');

  const actions = useActionSheet();
  const leave = () => onClose(finished ? 'done' : 'left');
  const { panelStyle, handleProps, attachBody, dismiss, leaving } = useSheetDrag({ onDismiss: leave });

  /** The close button: on the last screen it just closes. */
  const askToClose = async () => {
    if (finished) return dismiss();
    const pick = await actions.ask(
      'Close the check-in?',
      [{ title: 'Finish later' }, { title: 'Skip for today', style: 'destructive' }],
      'Later picks up where you left off.'
    );
    if (pick === 0) dismiss();
    if (pick === 1) skip();
  };

  const renderStep = (step: Step) => {
    switch (step.kind) {
      case 'sore': {
        const sore = sores.find((s) => s.id === step.soreId);
        if (!sore) {
          return (
            <Placeholder
              title="This sore is gone"
              onNext={go}
              busy={busy}
            />
          );
        }
        return (
          <SoreStep
            sore={sore}
            allSores={openSores}
            doneIds={doneIds}
            now={now}
            onBusy={setStepBusy}
            onChange={(next) => setSores((prev) => replaceSore(prev, next))}
            onNext={go}
          />
        );
      }
      case 'new-sore-ask':
        return (
          <NewSoreAsk
            sores={sores}
            // Its reading was taken on the map, so it needs no step of its
            // own: the screen asks again for another.
            onAdded={(sore) => setSores((prev) => [...prev, sore])}
            onNext={go}
            onBusy={setStepBusy}
          />
        );
      case 'sleep':
        return (
          <SleepStep {...habit} />
        );
      case 'food':
      case 'health':
      case 'treatments':
        return (
          <TagStep
            {...habit}
            kind={step.kind}
            initialDay={defaultDay(now)}
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
      // The whole window: the app's native tab bar steps out of its way.
      data-covers-tabs=""
      className="fixed inset-0 z-50"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !locked && !e.defaultPrevented) {
          e.preventDefault();
          dismiss();
        }
      }}
    >
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-black/40 animate-scrim-in transition-opacity duration-200',
          leaving && 'opacity-0'
        )}
      />
      <div
        className="fold-first-pane safe-x absolute inset-x-0 bottom-0 top-[calc(var(--safe-top)+0.75rem)] mx-auto flex w-full max-w-lg flex-col rounded-t-worksheet bg-background shadow-sheet animate-sheet-in"
        style={panelStyle}
      >
        <header
          {...(locked ? {} : handleProps)}
          className="grid shrink-0 cursor-grab grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 pb-2 pt-2 active:cursor-grabbing"
        >
          <span
            aria-hidden="true"
            className="col-span-2 mx-auto mb-2 block h-1.5 w-10 rounded-full bg-control/50"
          />
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div
              role="progressbar"
              aria-label="Check-in progress"
              aria-valuemin={0}
              aria-valuemax={asked.length}
              aria-valuenow={finished ? asked.length : position}
              aria-valuetext={
                finished
                  ? 'All done'
                  : `Step ${position + 1} of ${asked.length}`
              }
              className="flex min-w-0 gap-1"
            >
              {asked.map((s, i) => (
                <span
                  key={stepKey(s)}
                  className={cn(
                    'h-1.5 min-w-0 flex-1 rounded-full transition-colors duration-300',
                    finished || i < position
                      ? 'bg-primary'
                      : i === position
                        ? 'bg-primary/45'
                        : 'bg-border'
                  )}
                />
              ))}
            </div>
            {!finished && (
              <span
                aria-hidden="true"
                className="tabular whitespace-nowrap text-sm font-semibold text-muted-foreground"
              >
                {`${position + 1} of ${asked.length}`}
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full bg-muted"
            aria-label={finished ? 'Close the check-in' : 'Close or skip the check-in'}
            onClick={() => {
              tap();
              askToClose();
            }}
            disabled={locked}
          >
            <X aria-hidden="true" className="!size-5" />
          </Button>
        </header>

        <div
          ref={attachBody}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {/* Keyed so each step starts fresh and its heading takes focus. */}
          <div
            key={current}
            className="w-full px-4 pb-[calc(var(--safe-bottom)+1rem)] pt-1"
          >
            {isHabitStep(step) && soreSteps.length + loggedToday.length > 0 && (
              <SoresStrip
                sores={loggedToday}
                onEdit={() => {
                  tap();
                  const first =
                    soreSteps[0] ?? steps.find((s) => s.kind === 'new-sore-ask');
                  if (first) setCurrent(stepKey(first));
                }}
                disabled={locked}
              />
            )}
            {renderStep(step)}
          </div>
        </div>
      </div>
      {actions.sheet}
    </div>
  );
}

/**
 * On the habit screens the map steps aside for one line: the sores logged
 * so far today, in their pain colours, and a way back to change them.
 */
function SoresStrip({
  sores,
  onEdit,
  disabled
}: {
  sores: Sore[];
  onEdit: () => void;
  disabled: boolean;
}) {
  return (
    <div className="mb-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-cell border-2 border-border bg-card py-1 pl-4 pr-1">
      <div className="flex" aria-hidden="true">
        {sores.slice(0, 6).map((s, i) => (
          <span
            key={s.id}
            className={cn(
              'size-3.5 rounded-full border-2 border-card',
              i > 0 && '-ml-1'
            )}
            style={{ backgroundColor: sevFill(currentPain(s)) }}
          />
        ))}
      </div>
      <p className="truncate text-sm font-semibold">
        {sores.length === 0
          ? 'No sores logged yet'
          : `${sores.length} sore${sores.length === 1 ? '' : 's'} logged`}
      </p>
      <Button
        type="button"
        variant="ghost"
        className="h-11 text-primary"
        onClick={onEdit}
        disabled={disabled}
      >
        Edit
      </Button>
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
        <BusyIcon busy={busy} />
        Next
      </Button>
    </div>
  );
}
