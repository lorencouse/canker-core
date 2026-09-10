import { redirect } from 'next/navigation';

import { Separator } from '@/components/ui/separator';
import { getUserDetails } from '@/lib/queries';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
  const user = await getUserDetails();
  if (!user) redirect('/signin/password_signin');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-subhead">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Your name and the email you sign in with. Nothing here is shown to
          anyone else.
        </p>
      </div>
      <Separator />
      <ProfileForm user={user} />
    </div>
  );
}
