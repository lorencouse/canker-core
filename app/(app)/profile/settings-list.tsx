'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Bell,
  KeyRound,
  LogOut,
  Share,
  SunMoon
} from 'lucide-react';

import BuildLabel from '@/components/BuildLabel';
import { SparkleField } from '@/components/graphics/Sparkles';
import Kanko from '@/components/kanko/Kanko';
import { useActionSheet } from '@/components/ui/action-sheet';
import { Sheet } from '@/components/ui/sheet';
import { toast } from '@/components/ui/Toasts/use-toast';
import type { User } from '@/types';
import {
  SignOut,
  deleteAccount,
  redirectToPath
} from '@/utils/auth-helpers/server';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import { useMounted } from '@/utils/hooks/useMounted';
import { notify, shareTextFile } from '@/utils/native';
import { readReminder, remindersSupported } from '@/utils/reminders';
import { deleteAllPhotos } from '@/utils/sore-photos';

import { ButtonRow, Group, LinkRow, Tile } from './components/grouped-list';
import { PasswordForm } from './password-form';
import { ProfileForm } from './profile-form';

const THEME_LABEL: Record<string, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System'
};

/**
 * Settings, one grouped list. Rows that hold a few controls push to their
 * own screen (Reminders, Appearance); short edits open in a sheet (name and
 * email, password); the rest are actions. Sign out and Delete account ask
 * first, as the system's action sheet in the app and the same sheet drawn
 * on the web.
 */
export function SettingsList({ user }: { user: User }) {
  const mounted = useMounted();
  const { theme } = useTheme();
  const pathname = usePathname();
  const clientRouter = useRouter();
  const actions = useActionSheet();
  const [sheet, setSheet] = useState<'profile' | 'password' | null>(null);
  const [busy, setBusy] = useState<'export' | 'delete' | 'signout' | null>(
    null
  );

  const morning = mounted && remindersSupported() ? readReminder('morning') : null;
  const reminderValue = !mounted
    ? ''
    : !morning
      ? 'App only'
      : morning.enabled
        ? morning.time
        : 'Off';

  const exportData = async () => {
    setBusy('export');
    try {
      const res = await fetch('/api/export', { credentials: 'same-origin' });
      if (!res.ok) throw new Error(String(res.status));
      const text = await res.text();
      const name =
        /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ??
        'canker-core.csv';
      // The share sheet in the app; a download everywhere else, and in an
      // app built before the Share plugin was added.
      if (await shareTextFile(name, text, 'Canker Core data')) return;
      const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast({ variant: 'destructive', title: 'Could not export. Try again.' });
    } finally {
      setBusy(null);
    }
  };

  const signOut = async () => {
    const pick = await actions.ask('Sign out?', [{ title: 'Sign out' }]);
    if (pick !== 0) return;
    setBusy('signout');
    try {
      const form = new FormData();
      form.set('pathName', pathname);
      const to = await SignOut(form);
      if (getRedirectMethod() === 'client') {
        clientRouter.push(to);
        clientRouter.refresh();
      } else {
        await redirectToPath(to);
      }
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    const pick = await actions.ask(
      'Delete your account?',
      [{ title: 'Delete everything', style: 'destructive' }],
      'Every sore and reading goes, for good.'
    );
    if (pick !== 0) return;
    setBusy('delete');
    const result = await deleteAccount();
    if (!result.ok) {
      setBusy(null);
      notify('error');
      toast({ variant: 'destructive', title: result.error });
      return;
    }
    // Sore photos live only on this device, out of the server's reach.
    await deleteAllPhotos();
    // The session is gone; a hard navigation drops every cached server
    // component that still believes someone is signed in.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/');
  };

  return (
    <div className="grid gap-6">
      <Group label="Profile">
        <ButtonRow
          lead={
            <span aria-hidden="true" className="relative size-12 shrink-0">
              {/* A round avatar on the page ground: the dark art is drawn
                  on that ground, so no square shows inside the card. */}
              <span className="block size-12 overflow-hidden rounded-full bg-background">
                <Kanko mood="clipboard" size={48} className="size-12" />
              </span>
              <SparkleField
                sparkles={[
                  { top: '-6%', left: '78%', size: 10, delay: 0.4 },
                  { top: '62%', left: '-10%', size: 8, tone: 'comfort' }
                ]}
              />
            </span>
          }
          label={user.full_name || 'Your name'}
          sub={user.email}
          chevron
          onClick={() => setSheet('profile')}
          className="[&_.row-body]:min-h-[4.5rem]"
        />
      </Group>

      <Group label="Preferences">
        <LinkRow
          href="/profile/notifications"
          lead={<Tile icon={Bell} color="amber" />}
          label="Reminders"
          value={reminderValue}
        />
        <LinkRow
          href="/profile/appearance"
          lead={<Tile icon={SunMoon} color="indigo" />}
          label="Appearance"
          value={mounted ? THEME_LABEL[theme ?? 'system'] ?? 'System' : ''}
        />
      </Group>

      <Group label="Account">
        <ButtonRow
          lead={<Tile icon={KeyRound} color="slate" />}
          label="Password"
          chevron
          onClick={() => setSheet('password')}
        />
        <ButtonRow
          lead={<Tile icon={Share} color="green" />}
          label="Export data"
          value={busy === 'export' ? 'Preparing…' : 'CSV'}
          onClick={exportData}
          disabled={busy !== null}
        />
      </Group>

      <Group label="Session">
        <ButtonRow
          lead={<Tile icon={LogOut} color="slate" />}
          label="Sign out"
          onClick={signOut}
          disabled={busy !== null}
        />
        <ButtonRow
          label={busy === 'delete' ? 'Deleting…' : 'Delete account'}
          tone="destructive"
          onClick={remove}
          disabled={busy !== null}
        />
      </Group>

      <BuildLabel className="block text-center text-xs text-muted-foreground" />

      <Sheet
        open={sheet === 'profile'}
        onOpenChange={(open) => !open && setSheet(null)}
        title="Profile"
      >
        <ProfileForm user={user} onDone={() => setSheet(null)} />
      </Sheet>
      <Sheet
        open={sheet === 'password'}
        onOpenChange={(open) => !open && setSheet(null)}
        title="Password"
      >
        <PasswordForm onDone={() => setSheet(null)} />
      </Sheet>
      {actions.sheet}
    </div>
  );
}
