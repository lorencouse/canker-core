import { redirect } from 'next/navigation';

import Kanko from '@/components/kanko/Kanko';
import { Separator } from '@/components/ui/separator';
import { getUserDetails } from '@/lib/queries';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
  const user = await getUserDetails();
  if (!user) redirect('/signin/password_signin');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-subhead">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Your name and the email you sign in with. Nothing here is shown to
            anyone else.
          </p>
        </div>
        <Kanko mood="clipboard" size={96} className="size-24 shrink-0" />
      </div>
      <Separator />
      <ProfileForm user={user} />
    </div>
  );
}
