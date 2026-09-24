'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Loader2 } from 'lucide-react';

import AuthField from '@/components/ui/AuthForms/AuthField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/Toasts/use-toast';
import { handleRequest } from '@/utils/auth-helpers/client';
import { deleteAccount, updatePassword } from '@/utils/auth-helpers/server';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';

/**
 * Account: change password, export, delete.
 *
 * Three things a person does rarely and deliberately, so each sits in its
 * own block with its own button rather than sharing a Save. Delete is last
 * and behind a dialog: the privacy page promises a way to remove everything,
 * and this is it, but it should never be reachable by a stray tap.
 */
export function AccountForm() {
  const clientRouter = useRouter();
  const router = getRedirectMethod() === 'client' ? clientRouter : null;
  const [savingPassword, setSavingPassword] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const submitPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    setSavingPassword(true);
    try {
      await handleRequest(e, updatePassword, router);
    } finally {
      setSavingPassword(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    const result = await deleteAccount();
    if (!result.ok) {
      setDeleting(false);
      toast({ variant: 'destructive', title: result.error });
      return;
    }
    // The session is gone; a hard navigation drops every cached
    // server component that still believes someone is signed in, which
    // router.push would keep.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/');
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="font-medium">Password</h3>
        <form noValidate onSubmit={submitPassword} className="grid gap-4">
          <AuthField
            id="currentPassword"
            name="currentPassword"
            label="Current password"
            type="password"
            autoComplete="current-password"
            hint="Signed up with Google or GitHub, or a magic link? Use “Forgot password” on the sign-in page to set one."
          />
          <AuthField
            id="password"
            name="password"
            label="New password"
            type="password"
            autoComplete="new-password"
          />
          <AuthField
            id="passwordConfirm"
            name="passwordConfirm"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
          />
          <div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword && <Loader2 className="animate-spin" />}
              Change password
            </Button>
          </div>
        </form>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="font-medium">Your data</h3>
        <p className="text-sm text-muted-foreground">
          Every reading of every sore as a spreadsheet: one row per reading,
          with where it was, how big, how much it hurt, and when it healed.
          Handy for a dentist.
        </p>
        <Button asChild variant="outline">
          {/* A plain link, not a fetch: the browser handles the download and
              the file name comes from the response. */}
          <a href="/api/export" download>
            <Download aria-hidden="true" />
            Download CSV
          </a>
        </Button>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="font-medium text-destructive">Delete account</h3>
        <p className="text-sm text-muted-foreground">
          Removes your account, every sore and every reading, immediately and
          for good. Download your data first if you want to keep it.
        </p>
        <Button
          type="button"
          variant="outline"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirmingDelete(true)}
        >
          Delete my account
        </Button>
      </section>

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This removes you and all of your readings right away. There is no
              undo and nothing is kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="touch"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
            >
              Keep my account
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="touch"
              onClick={remove}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete everything'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
