import SoreHistoryLayout from './history-layout';
import { getDayLogs, getSores, getUserDetails } from '@/lib/queries';
import { redirect } from 'next/navigation';
export default async function HistoryPage() {
  const user = await getUserDetails();

  if (!user) {
    redirect('/signin/password_signin');
  }

  const [sores, dayLogs] = await Promise.all([getSores(user.id), getDayLogs(user.id)]);

  return <SoreHistoryLayout user={user} sores={sores} dayLogs={dayLogs} />;
}
