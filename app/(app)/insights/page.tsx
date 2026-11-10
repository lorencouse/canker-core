import InsightsLayout from './insights-layout';
import { getDayLogs, getSores, getUser } from '@/lib/queries';
import { redirect } from 'next/navigation';
export default async function InsightsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/signin/password_signin');
  }

  const [sores, dayLogs] = await Promise.all([getSores(user.id), getDayLogs(user.id)]);

  return <InsightsLayout sores={sores} dayLogs={dayLogs} />;
}
