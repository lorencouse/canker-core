import { redirect } from 'next/navigation';

import { Separator } from '@/components/ui/separator';
import { getUserDetails } from '@/lib/queries';
import { AccountForm } from './account-form';

export default async function SettingsAccountPage() {
  const user = await getUserDetails();
  if (!user) redirect('/signin/password_signin');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-subhead">Account</h2>
        <p className="text-sm text-muted-foreground">
          Your password, a copy of your data, and the way out.
        </p>
      </div>
      <Separator />
      <AccountForm />
    </div>
  );
}
