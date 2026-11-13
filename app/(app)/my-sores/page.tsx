import MySoresLayout from './my-sores-layout';
import { getUser, getSores } from '@/lib/queries';
import { redirect } from 'next/navigation';
export default async function MySoresPage({
  searchParams
}: {
  searchParams: Promise<{ sore?: string; add?: string; log?: string }>;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/signin/password_signin');
  }

  const soresData = await getSores(user.id);

  const { sore, add, log } = await searchParams;

  return (
    <MySoresLayout
      user={user}
      soresData={soresData ?? []}
      // From Insights' "Show on map": open with that sore selected.
      initialSelectedId={sore ?? null}
      // From the top bar's "New sore": land ready to place one.
      startInAddMode={add !== undefined}
      // From a swipe to Log on Today: that sore's card, on today's reading.
      startLogging={log !== undefined}
    />
  );
}
