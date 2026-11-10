import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  getDayLogs,
  getRecentCheckIns,
  getSores,
  getUser
} from '@/lib/queries';
import { expectedMood } from '@/utils/momentum';
import { TIME_ZONE_COOKIE } from '@/utils/time-zone-cookie';
import TodayScreen from './today-screen';

export const metadata = {
  title: 'Today',
  description: 'Log today’s readings and what else happened.'
};

export default async function TodayPage({
  searchParams
}: {
  searchParams: Promise<{ checkin?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect('/signin/password_signin');

  const [sores, dayLogs, checkIns, cookieStore, { checkin }] =
    await Promise.all([
      getSores(user.id),
      getDayLogs(user.id),
      getRecentCheckIns(user.id),
      cookies(),
      searchParams
    ]);

  return (
    <TodayScreen
      user={user}
      sores={sores}
      dayLogs={dayLogs}
      checkIns={checkIns}
      // The morning reminder's link: open the check-in even if it is done.
      openCheckIn={checkin === '1'}
      expectedMood={expectedMood(
        sores,
        dayLogs,
        new Date(),
        cookieStore.get(TIME_ZONE_COOKIE)?.value
      )}
    />
  );
}
