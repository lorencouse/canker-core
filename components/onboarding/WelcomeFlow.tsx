'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';

import FirstReading from '@/components/onboarding/FirstReading';
import CourseStrip from '@/components/sore/CourseStrip';
import SoreSigil from '@/components/sore/SoreSigil';
import MouthMap from '@/components/mouth-map/MouthMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/Toasts/use-toast';
import { SoreProvider, useSoreContext } from '@/context/SoreContext';
import type { Sore, User } from '@/types';
import { completeOnboarding } from '@/utils/actions/onboardingActions';
import { upsertSores } from '@/utils/actions/soreActions';
import { cn } from '@/utils/cn';
import { notify, tap } from '@/utils/native';
import {
  DEFAULT_TIME,
  applyReminder,
  remindersSupported,
  type ReminderPref
} from '@/utils/reminders';

/**
 * The first run: place a sore, measure it, keep going.
 *
 * It is not a tour. Coach marks over an empty app teach the chrome and leave
 * the person with nothing to show for it; this walks them through the thing
 * they came to do, and at the end they own a real sore with a real reading
 * and a course one day long. The map, the sliders and the sigil they meet
 * here are the same components they will use every day, so nothing has to be
 * learned twice.
 *
 * Nothing is written until the last step. Skipping, or closing the tab
 * halfway, leaves no half-placed sore behind.
 */

const STEPS = ['place', 'measure', 'ready'] as const;
type Step = (typeof STEPS)[number];

export default function WelcomeFlow({ user }: { user: User }) {
  // The map is built on the sore context, so the flow lives inside one and
  // reads the placed sore back out of it rather than duplicating the state.
  return (
    <SoreProvider initialSores={[]}>
      <Flow user={user} />
    </SoreProvider>
  );
}

function Flow({ user }: { user: User }) {
  const router = useRouter();
  const { sores, setSores, setMode, setSelectedSore } = useSoreContext();
  const [step, setStep] = useState<Step>('place');
  const [saving, setSaving] = useState(false);
  const [reminder, setReminder] = useState<ReminderPref>({
    enabled: true,
    time: DEFAULT_TIME
  });
  const [canRemind, setCanRemind] = useState(false);

  // Add mode from the start: there is nothing on this map to view or drag,
  // and it carries the map's own "tap where the sore is" hint for free.
  useEffect(() => setMode('add'), [setMode]);
  useEffect(() => setCanRemind(remindersSupported()), []);

  /*
   * One sore, whichever was tapped last. Add mode is built to place several
   * in a row, which is right on the map and wrong here — so a second tap
   * moves the mark rather than adding to it.
   */
  useEffect(() => {
    if (sores.length > 1) {
      const last = sores[sores.length - 1];
      setSores([last]);
      setSelectedSore(last);
    }
  }, [sores, setSores, setSelectedSore]);

  const sore: Sore | null = sores[0] ?? null;
  const index = STEPS.indexOf(step);

  const updateSore = (next: Sore) => setSores([next]);

  const leave = async (write: boolean) => {
    setSaving(true);
    try {
      if (write && sore) {
        const saved = await upsertSores([sore]);
        if (!saved.ok) {
          notify('error');
          toast({ variant: 'destructive', title: saved.error });
          return;
        }
        if (canRemind && reminder.enabled) await applyReminder(reminder);
      }

      // Marked seen either way. Someone who skips has still been introduced,
      // and showing them this screen again tomorrow would be a bug.
      const done = await completeOnboarding();
      if (!done.ok) {
        toast({ variant: 'destructive', title: done.error });
        return;
      }
      if (write) notify('success');
      router.push('/today');
    } finally {
      setSaving(false);
    }
  };

  const copy = useMemo(() => COPY[step], [step]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-5 lg:py-10">
      <Progress index={index} />

      <header className="mt-5">
        <h1 className="text-title">{copy.title}</h1>
        <p className="prose-measure mt-2 text-muted-foreground">{copy.body}</p>
      </header>

      <div className="mt-6 flex-1">
        {step === 'place' && <MouthMap user={user} />}

        {step === 'measure' && sore && (
          <FirstReading sore={sore} onChange={updateSore} />
        )}

        {step === 'ready' && sore && (
          <Ready
            sore={sore}
            reminder={reminder}
            onReminder={setReminder}
            canRemind={canRemind}
          />
        )}
      </div>

      {/* Sticky so the way forward is under the thumb however tall the map
          or the sliders above it turn out to be. */}
      <div className="sticky bottom-0 mt-6 flex items-center gap-2 bg-background pb-1 pt-3">
        {index > 0 && (
          <Button
            type="button"
            variant="outline"
            size="touch"
            onClick={() => {
              tap();
              setStep(STEPS[index - 1]);
            }}
            aria-label="Back a step"
            className="px-3"
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
        )}

        {step === 'ready' ? (
          <Button
            type="button"
            size="touch"
            className="flex-1"
            disabled={saving}
            onClick={() => {
              tap();
              leave(true);
            }}
          >
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Check aria-hidden="true" />
            )}
            {saving ? 'Saving…' : 'Start tracking'}
          </Button>
        ) : (
          <Button
            type="button"
            size="touch"
            className="flex-1"
            disabled={!sore}
            onClick={() => {
              tap();
              setStep(STEPS[index + 1]);
            }}
          >
            {sore ? 'Next' : 'Tap the spot to continue'}
            {sore && <ArrowRight aria-hidden="true" />}
          </Button>
        )}
      </div>

      {/* A way out on every step. Someone signing up without a sore in their
          mouth right now is a normal case, not a dropout. */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mx-auto mt-1 text-muted-foreground"
        disabled={saving}
        onClick={() => leave(false)}
      >
        {sore ? 'Skip for now' : 'I don’t have one right now'}
      </Button>
    </div>
  );
}

const COPY: Record<Step, { title: string; body: string }> = {
  place: {
    title: 'Where is it?',
    body: 'Tap the spot in your mouth. Use the tabs to switch to your cheeks or lips — and tap again if you want to move the mark.'
  },
  measure: {
    title: 'How big, and how bad?',
    body: 'The circle is close to life size. Drag until it looks about right; the colour is the pain scale you will see everywhere else.'
  },
  ready: {
    title: 'That’s the whole routine.',
    body: 'Come back tomorrow and move the same two sliders. Two readings make a line, and a line is the only thing that answers whether it is shrinking.'
  }
};

/** Three steps, so the bar has three parts. */
function Progress({ index }: { index: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {STEPS.map((name, i) => (
        <span
          key={name}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors',
            i <= index ? 'bg-primary' : 'bg-muted'
          )}
        />
      ))}
    </div>
  );
}

/**
 * The last step shows them what they just made: their own sigil, and a
 * course exactly one day long. It is the payoff for the two steps before it,
 * and it introduces both marks before they are met in a list.
 */
function Ready({
  sore,
  reminder,
  onReminder,
  canRemind
}: {
  sore: Sore;
  reminder: ReminderPref;
  onReminder: (next: ReminderPref) => void;
  canRemind: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="surface-worksheet flex items-center gap-3 p-4">
        <SoreSigil sore={sore} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{sore.zone}</p>
          <p className="tabular text-xs text-muted-foreground">Day 1</p>
        </div>
        <CourseStrip sore={sore} size="md" />
      </div>

      {canRemind ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="welcome-reminder">Remind me each day</Label>
              <p className="text-sm text-muted-foreground">
                One notification, nothing else.
              </p>
            </div>
            <Switch
              id="welcome-reminder"
              checked={reminder.enabled}
              onCheckedChange={(enabled) => onReminder({ ...reminder, enabled })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="welcome-reminder-time">Time</Label>
            <Input
              id="welcome-reminder-time"
              type="time"
              className="w-40"
              value={reminder.time}
              disabled={!reminder.enabled}
              onChange={(e) => {
                if (/^\d{2}:\d{2}$/.test(e.target.value))
                  onReminder({ ...reminder, time: e.target.value });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Evenings work best: the day&rsquo;s eating is done and the sore
              has had its say.
            </p>
          </div>
        </div>
      ) : (
        <p className="prose-measure text-sm text-muted-foreground">
          The iPhone and Android apps can nudge you at a set time each day. In
          a browser the Today tab shows what is still to log instead.
        </p>
      )}
    </div>
  );
}
