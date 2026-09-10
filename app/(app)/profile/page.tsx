// app/profile/page.tsx

import { Separator } from '@/components/ui/separator';
import { ContactInfoForm } from './contact-info-form';
import { User } from '@/types';
import { getUserDetails } from '@/lib/queries';
import { redirect } from 'next/navigation';

export default async function ContactInfoPage() {
  const profile: User | null = await getUserDetails();

  if (!profile) {
    redirect('/signin/password_signin');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-subhead">Contact Info</h2>
        <p className="text-sm text-muted-foreground">
          This is how others will see your info on the site.
        </p>
      </div>
      <Separator />
      <ContactInfoForm userProfile={profile} />
    </div>
  );
}
