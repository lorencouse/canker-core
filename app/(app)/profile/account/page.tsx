import { redirect } from 'next/navigation';

import InfoButton from '@/components/ui/info-button';
import { Separator } from '@/components/ui/separator';
import { getUser } from '@/lib/queries';
import { AccountForm } from './account-form';

export default async function SettingsAccountPage() {
  const user = await getUser();
  if (!user) redirect('/signin/password_signin');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-subhead">Account</h2>
        <InfoButton title="Account">
          <p>Your password, a copy of your data, and the way out.</p>
        </InfoButton>
      </div>
      <Separator />
      <AccountForm />
    </div>
  );
}
