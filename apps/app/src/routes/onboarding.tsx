import { createRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button, Input, Label, Switch } from '@canker/ui';
import { authedRoute } from '@/router-base';
import { useProfile, useUpdateProfile } from '@/lib/data';

export const onboardingRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/onboarding',
  component: OnboardingPage
});

/**
 * Three screens, no scrolling: what this is, when to remind you, and whether
 * there's a sore right now. Sets onboarded_at at the end so the gate in
 * AppShell stops redirecting here.
 */
function OnboardingPage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const update = useUpdateProfile();
  const [step, setStep] = useState(0);
  const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [reminderOn, setReminderOn] = useState(true);
  const [reminderAt, setReminderAt] = useState('20:30');

  async function finish(hasSoreNow: boolean) {
    await update.mutateAsync({
      timezone:
        profile.data?.timezone && profile.data.timezone !== 'UTC'
          ? profile.data.timezone
          : deviceTz,
      reminder_enabled: reminderOn,
      reminder_at: reminderOn ? reminderAt : null,
      onboarded_at: new Date().toISOString()
    });
    if (hasSoreNow) await navigate({ to: '/sores/new', search: {} });
    else await navigate({ to: '/today', search: {} });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 py-12">
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-muted'}`}
          />
        ))}
      </div>

      {step === 0 ? (
        <>
          <div>
            <p className="font-display text-accent text-sm font-semibold">Canker Core</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              One check-in a day. Patterns over time.
            </h1>
            <p className="text-secondary-foreground mt-3">
              Each day, tell it how each sore feels and tap what you ate, took or went
              through. After a few flare-ups it starts showing you what tends to come
              first, and what tends to help.
            </p>
          </div>
          <Button size="lg" onClick={() => setStep(1)}>
            Continue
          </Button>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              When should it nudge you?
            </h1>
            <p className="text-secondary-foreground mt-3">
              Evening works for most people: the day is done and the mirror is right
              there.
            </p>
          </div>
          <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="rem-on">Daily reminder</Label>
              <Switch id="rem-on" checked={reminderOn} onCheckedChange={setReminderOn} />
            </div>
            {reminderOn ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rem-at">Time</Label>
                <Input
                  id="rem-at"
                  type="time"
                  value={reminderAt}
                  onChange={(e) => setReminderAt(e.target.value)}
                  className="max-w-40"
                />
              </div>
            ) : null}
            <p className="text-muted-foreground text-xs">
              Timezone: {deviceTz.replace(/_/g, ' ')}. You can change this in Settings.
            </p>
          </div>
          <Button size="lg" onClick={() => setStep(2)}>
            Continue
          </Button>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Do you have a sore right now?
            </h1>
            <p className="text-secondary-foreground mt-3">
              If so, we'll place it on the map together. If not, you'll start with a clear
              mouth and log your first day.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              disabled={update.isPending}
              onClick={() => void finish(true)}
            >
              Yes, place it
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={update.isPending}
              onClick={() => void finish(false)}
            >
              No, all clear
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
