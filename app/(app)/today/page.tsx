import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getDayLogs, getSores, getUserDetails } from '@/lib/queries';
import { expectedMood } from '@/utils/momentum';
import { TIME_ZONE_COOKIE } from '@/utils/time-zone-cookie';
import TodayScreen from './today-screen';

export const metadata = {
  title: 'Today',
  description: 'Log today’s readings and what else happened.'
};

export default async function TodayPage() {
  const user = await getUserDetails();
  if (!user) redirect('/signin/password_signin');

  const [sores, dayLogs, cookieStore] = await Promise.all([
    getSores(user.id),
    getDayLogs(user.id),
    cookies()
  ]);

  return (
    <TodayScreen
      user={user}
      sores={sores}
      dayLogs={dayLogs}
      expectedMood={expectedMood(
        sores,
        dayLogs,
        new Date(),
        cookieStore.get(TIME_ZONE_COOKIE)?.value
      )}
    />
  );
}
