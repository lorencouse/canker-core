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
  type ReminderPref
} from '@/utils/reminders';

/**
 * The daily reminder switch and time.
 *
 * Saves on change — there is nothing to review before committing, and a Save
 * button under a single switch reads as a form that failed to submit.
 */
export function ReminderForm() {
  // Both values live in the browser, so read them after mount rather than
  // during the server render. Until the first change, the stored preference
  // is the answer.
  const mounted = useMounted();
  const [changed, setPref] = useState<ReminderPref | null>(null);
  const pref = mounted ? (changed ?? readReminder()) : null;
  const supported = mounted && remindersSupported();

  if (!pref) return null;

  const update = async (next: ReminderPref) => {
    setPref(next);
    const ok = await applyReminder(next);
    if (!ok) {
      setPref({ ...next, enabled: false });
      toast({
        variant: 'destructive',
        title: 'Notifications are turned off for Canker Core.',
        description: 'Allow them in your phone’s settings, then try again.'
      });
    }
  };

  if (!supported) {
    return (
      <p className="prose-measure text-sm text-muted-foreground">
        Reminders come with the iPhone and Android apps, which can nudge you at
        a set time each day. In a browser there is no way to schedule that, so
        the Today tab shows what is still to log instead.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="reminder-enabled">Remind me every day</Label>
          <p className="text-sm text-muted-foreground">
            One notification, at the time below.
          </p>
        </div>
        <Switch
          id="reminder-enabled"
          checked={pref.enabled}
          onCheckedChange={(enabled) => update({ ...pref, enabled })}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="reminder-time">Time</Label>
        <Input
          id="reminder-time"
          type="time"
          className="w-40"
          value={pref.time}
          disabled={!pref.enabled}
          onChange={(e) => {
            if (/^\d{2}:\d{2}$/.test(e.target.value))
              update({ ...pref, time: e.target.value });
          }}
        />
        <p className="text-xs text-muted-foreground">
          Evenings work best: the day’s eating is done and the sore has had its
          say.
        </p>
      </div>
    </div>
  );
}
