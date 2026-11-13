import PushScreen from '@/components/shell/PushScreen';
import { redirect } from 'next/navigation';

import LargeTitle from '@/components/shell/LargeTitle';
import { getUser } from '@/lib/queries';

import { SettingsList } from './settings-list';

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect('/signin/password_signin');

  return (
    <PushScreen>
      <LargeTitle className="mb-4 lg:mb-6">Settings</LargeTitle>
      <SettingsList user={user} />
    </PushScreen>
  );
}
