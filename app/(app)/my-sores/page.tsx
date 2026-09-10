import MySoresLayout from './my-sores-layout';
import { getUserDetails, getSores } from '@/lib/queries';
import { redirect } from 'next/navigation';
export default async function MySoresPage({
  searchParams
}: {
  searchParams: Promise<{ sore?: string; add?: string }>;
}) {
  const user = await getUserDetails();

  if (!user) {
    redirect('/signin/password_signin');
  }

  const soresData = await getSores(user.id);

  const { sore, add } = await searchParams;

  return (
    <MySoresLayout
      user={user}
      soresData={soresData ?? []}
      // From Insights' "Show on map": open with that sore selected.
      initialSelectedId={sore ?? null}
      // From the top bar's "New sore": land ready to place one.
      startInAddMode={add !== undefined}
    />
  );
}
