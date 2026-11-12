'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, BellOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/Toasts/use-toast';
import { tap } from '@/utils/native';
import {
  MORNING_TIME,
  allowReminderNotifications,
  applyReminder,
  dismissReminderOffer,
  reminderStatus
} from '@/utils/reminders';

const BLOCKED_TOAST = {
  variant: 'destructive' as const,
  title: 'Notifications are turned off for Canker Core.',
  description: 'Allow them in your phone’s settings, then try again.'
};

// '08:00' reads as '8:00' in copy.
const MORNING_LABEL = MORNING_TIME.replace(/^0/, '');

/**
 * Today's word on reminders, in the app only: an offer on a phone that has
 * never been asked, or a warning when a reminder is on but the phone blocks
 * it. Reminders are local to each phone and off until chosen, and the only
 * other place they were offered is onboarding, which runs once per account,
 * so without this a phone could go on with no reminder and no hint why.
 * Renders nothing otherwise.
 */
export default function ReminderOffer() {
  const [status, setStatus] = useState<'offer' | 'blocked' | 'ok'>('ok');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let gone = false;
    reminderStatus()
      .then((next) => !gone && setStatus(next))
      .catch((error) => console.error('reminder status failed', error));
    return () => {
      gone = true;
    };
  }, []);

  if (status === 'ok') return null;

  const turnOn = async () => {
    tap();
    setBusy(true);
    try {
      const ok = await applyReminder('morning', {
        enabled: true,
        time: MORNING_TIME
      });
      if (ok) {
        setStatus('ok');
        toast({ title: `Reminder set for ${MORNING_LABEL} each morning.` });
      } else {
        // The refusal is recorded as a choice, so the offer does not return.
        setStatus('ok');
        toast(BLOCKED_TOAST);
      }
    } catch (error) {
      console.error('could not set the reminder', error);
      toast({ variant: 'destructive', title: 'Could not set the reminder.' });
    } finally {
      setBusy(false);
    }
  };

  const allow = async () => {
    tap();
    setBusy(true);
    try {
      if (await allowReminderNotifications()) setStatus('ok');
      else toast(BLOCKED_TOAST);
    } catch (error) {
      console.error('could not allow notifications', error);
      // The system prompt cannot be reopened from here; say where to go instead.
      toast(BLOCKED_TOAST);
    } finally {
      setBusy(false);
    }
  };

  const blocked = status === 'blocked';
  const Icon = blocked ? BellOff : Bell;

  return (
    <section
      aria-labelledby="reminder-offer"
      className="surface-worksheet mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 p-4 sm:p-5"
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 text-primary" />
      <div className="min-w-0">
        <h2 id="reminder-offer" className="font-bold">
          {blocked ? 'Reminders are blocked' : 'A daily reminder'}
        </h2>
        <p className="prose-measure text-sm text-muted-foreground">
          {blocked
            ? 'Notifications for Canker Core are off on this phone, so your reminders never arrive.'
            : `A nudge at ${MORNING_LABEL} each morning to check in. Change the time in Settings.`}
        </p>
      </div>
      <div className="col-span-2 flex flex-wrap gap-2">
        {blocked ? (
          <>
            <Button type="button" size="touch" disabled={busy} onClick={allow}>
              Allow
            </Button>
            <Button asChild variant="ghost" size="touch">
              <Link href="/profile/notifications">Settings</Link>
            </Button>
          </>
        ) : (
          <>
            <Button type="button" size="touch" disabled={busy} onClick={turnOn}>
              Turn on
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="touch"
              disabled={busy}
              onClick={() => {
                tap();
                dismissReminderOffer();
                setStatus('ok');
              }}
            >
              Not now
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
