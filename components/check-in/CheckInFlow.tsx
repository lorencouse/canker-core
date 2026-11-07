'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/Toasts/use-toast';
import type { Sore } from '@/types';
import { setCheckInStatus } from '@/utils/actions/checkInActions';
import {
  clearProgress,
  readProgress,
  writeProgress
} from '@/utils/check-in/progress';
import {
  buildSteps,
  nextStepAfter,
  stepKey,
  type Step
} from '@/utils/check-in/steps';
import { notify, tap } from '@/utils/native';
import { dayKey } from '@/utils/readings';

import NewSoreAsk from './NewSoreAsk';
import SoreStep from './SoreStep';
import StepHeading from './StepHeading';

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
 * the device when it first renders.
 */
export default function CheckInFlow({
  sores: initialSores,
  onClose
}: {
  sores: Sore[];
  /** Opened from the button rather than on its own; habit steps use it for their default day. */
  manual: boolean;
  onClose: (result: 'done' | 'skipped' | 'left') => void;
}) {
  const [today] = useState(() => dayKey(new Date()));
  // Sores as this check-in has written them, including any added in it.
  const [sores, setSores] = useState(initialSores);
  const [steps, setSteps] = useState(() => buildSteps(initialSores));
  const [current, setCurrent] = useState(() => {
    const saved = readProgress(today);
    return saved && steps.some((s) => stepKey(s) === saved)
      ? saved
      : stepKey(steps[0]);
  });
  const [busy, setBusy] = useState(false);

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
    } finally {
      setBusy(false);
    }
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
          />
        );
      // Placeholders until the habit screens land; each takes `manual` for its default day.
      case 'sleep':
        return (
          <Placeholder title="Sleep" onNext={() => go('next')} busy={busy} />
        );
      case 'food':
        return (
          <Placeholder title="Food" onNext={() => go('next')} busy={busy} />
        );
      case 'health':
        return (
          <Placeholder
            title="Health and mood"
            onNext={() => go('next')}
            busy={busy}
          />
        );
      case 'treatments':
        return (
          <Placeholder
            title="Treatments"
            onNext={() => go('next')}
            busy={busy}
          />
        );
      case 'finish':
        return (
          <Placeholder
            title="All logged"
            nextLabel="Done"
            onNext={() => onClose('done')}
            busy={busy}
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
          aria-label="Close the check-in and finish it later"
          onClick={() => {
            tap();
            onClose('left');
          }}
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
            disabled={busy}
          >
            Skip for today
          </Button>
        </footer>
      )}
    </div>
  );
}

/** A step whose screen is still to come: its title and a way past it. */
function Placeholder({
  title,
  nextLabel = 'Next',
  onNext,
  busy
}: {
  title: string;
  nextLabel?: string;
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
        {nextLabel}
      </Button>
    </div>
  );
}
