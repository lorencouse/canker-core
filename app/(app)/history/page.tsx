import SoreHistoryLayout from './history-layout';
import { getUserDetails, getSores } from '@/lib/queries';
import { redirect } from 'next/navigation';
export default async function MySoresPage() {
  const user = await getUserDetails();

  if (!user) {
    redirect('/signin/password_signin');
  }

  const soresData = await getSores(user.id);

  return <SoreHistoryLayout user={user} sores={soresData ?? []} />;
}
