'use client';

import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/Toasts/use-toast';
import { useMounted } from '@/utils/hooks/useMounted';
import {
  applyReminder,
  readReminder,
  remindersSupported,
  type ReminderPref,
  type ReminderSlot
} from '@/utils/reminders';

const SLOTS: Array<{
  slot: ReminderSlot;
  label: string;
  hint: string;
}> = [
  {
    slot: 'morning',
    label: 'Morning check-in',
    hint: 'A minute to log how your sores are today.'
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

  if (!mounted) return null;

  if (!supported) {
    return (
      <p className="prose-measure text-sm text-muted-foreground">
        Reminders come with the iPhone and Android apps, which can nudge you at
        a set time each day. In a browser there is no way to schedule that, so
        the Today tab shows what is still to log instead.
      </p>
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
    <div className="space-y-8">
      {SLOTS.map(({ slot, label, hint }) => {
        const pref = changed[slot] ?? readReminder(slot);
        return (
          <div key={slot} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Label htmlFor={`reminder-${slot}-enabled`}>{label}</Label>
                <p className="text-sm text-muted-foreground">{hint}</p>
              </div>
              <Switch
                id={`reminder-${slot}-enabled`}
                checked={pref.enabled}
                onCheckedChange={(enabled) => update(slot, { ...pref, enabled })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`reminder-${slot}-time`}>Time</Label>
              <Input
                id={`reminder-${slot}-time`}
                type="time"
                className="w-40"
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
