import { redirect } from 'next/navigation';

import Kanko from '@/components/kanko/Kanko';
import InfoButton from '@/components/ui/info-button';
import { Separator } from '@/components/ui/separator';
import { getUser } from '@/lib/queries';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect('/signin/password_signin');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-subhead">Profile</h2>
            <InfoButton title="Profile">
              <p>Your name and the email you sign in with.</p>
              <p>Nothing here is shown to anyone else.</p>
            </InfoButton>
          </div>
        </div>
        <Kanko mood="clipboard" size={96} className="size-24 shrink-0" />
      </div>
      <Separator />
      <ProfileForm user={user} />
    </div>
  );
}
