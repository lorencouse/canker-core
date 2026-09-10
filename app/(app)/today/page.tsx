import { redirect } from 'next/navigation';

import { getDayLogs, getSores, getUserDetails } from '@/lib/queries';
import TodayScreen from './today-screen';

export const metadata = {
  title: 'Today',
  description: 'Log today’s readings and what else happened.'
};

export default async function TodayPage() {
  const user = await getUserDetails();
  if (!user) redirect('/signin/password_signin');

  const [sores, dayLogs] = await Promise.all([
    getSores(user.id),
    getDayLogs(user.id)
  ]);

  return <TodayScreen sores={sores} dayLogs={dayLogs} />;
}
