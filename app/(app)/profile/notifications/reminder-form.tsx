'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import StoreBadges from '@/components/marketing/StoreBadges';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/Toasts/use-toast';
import { useMounted } from '@/utils/hooks/useMounted';
import {
  applyReminder,
  readReminder,
  reminderStatus,
  remindersSupported,
  type ReminderPref,
  type ReminderSlot
} from '@/utils/reminders';
import { APP_STORE_URL } from '@/utils/app-stores';

const SLOTS: Array<{
  slot: ReminderSlot;
  label: string;
  hint: string;
}> = [
  {
    slot: 'morning',
    label: 'Morning check-in',
    hint: 'A minute to log your sores.'
  },
  {
    slot: 'evening',
    label: 'Evening nudge',
    hint: 'Only if you have not checked in yet.'
  }
];

/**
 * The morning and evening reminders, each a switch and a time.
 *
 * Saves on change — there is nothing to review before committing, and a Save
 * button under a switch reads as a form that failed to submit.
 */
export function ReminderForm() {
  // Values live in the browser, so read them after mount rather than during
  // the server render. Until the first change, the stored preference is the
  // answer.
  const mounted = useMounted();
  const [changed, setChanged] = useState<
    Partial<Record<ReminderSlot, ReminderPref>>
  >({});
  const supported = mounted && remindersSupported();
  // A switch can be on while the phone blocks the app's notifications (the
  // launch sync keeps the choice rather than quietly turning it off), so say
  // so here, where the switch would otherwise look like it works.
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    if (!supported) return;
    reminderStatus()
      .then((status) => setBlocked(status === 'blocked'))
      .catch(() => setBlocked(false));
  }, [supported, changed]);

  if (!mounted) return null;

  if (!supported) {
    // The web build, where "need the phone app" alone was a dead end: say
    // why, then hand over the way to get it.
    return (
      <section
        aria-labelledby="reminders-app"
        className="surface-worksheet grid gap-3 p-4 sm:p-5"
      >
        <h2 id="reminders-app" className="text-section">
          Reminders live in the phone app
        </h2>
        <p className="prose-measure text-muted-foreground">
          A browser can’t nudge you at a set time. The app can: a morning
          check-in and an evening nudge, at the times you pick. Same account,
          same log.
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <StoreBadges className="-ml-2" />
          {!APP_STORE_URL && (
            <Link
              href="/app"
              className="focus-ring inline-flex min-h-11 items-center rounded-md font-semibold text-primary underline-offset-4 hover:underline"
            >
              iPhone app
            </Link>
          )}
        </div>
      </section>
    );
  }

  const update = async (slot: ReminderSlot, next: ReminderPref) => {
    setChanged((c) => ({ ...c, [slot]: next }));
    const ok = await applyReminder(slot, next);
    if (!ok) {
      setChanged((c) => ({ ...c, [slot]: { ...next, enabled: false } }));
      toast({
        variant: 'destructive',
        title: 'Notifications are turned off for Canker Core.',
        description: 'Allow them in your phone’s settings, then try again.'
      });
    }
  };

  return (
    <div className="grid gap-4">
      {blocked && (
        <p role="status" className="prose-measure text-sm font-bold">
          Notifications are off. Allow them in your phone’s settings.
        </p>
      )}
      {SLOTS.map(({ slot, label, hint }) => {
        const pref = changed[slot] ?? readReminder(slot);
        return (
          // One inset group per reminder: the switch row, then its time,
          // a native time input, which the phone opens as its own wheel.
          <div
            key={slot}
            className="overflow-hidden rounded-worksheet bg-card"
          >
            <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-2.5">
              <div className="min-w-0">
                <Label
                  htmlFor={`reminder-${slot}-enabled`}
                  className="text-base font-semibold"
                >
                  {label}
                </Label>
                <p className="truncate text-sm text-muted-foreground">{hint}</p>
              </div>
              <Switch
                id={`reminder-${slot}-enabled`}
                checked={pref.enabled}
                onCheckedChange={(enabled) =>
                  update(slot, { ...pref, enabled })
                }
              />
            </div>
            <div className="ml-4 flex min-h-14 items-center justify-between gap-4 border-t border-border pr-4">
              <Label
                htmlFor={`reminder-${slot}-time`}
                className="text-base font-semibold"
              >
                Time
              </Label>
              <Input
                id={`reminder-${slot}-time`}
                type="time"
                className="tabular h-10 w-32 rounded-full bg-muted text-center"
                value={pref.time}
                disabled={!pref.enabled}
                onChange={(e) => {
                  if (/^\d{2}:\d{2}$/.test(e.target.value))
                    update(slot, { ...pref, time: e.target.value });
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
