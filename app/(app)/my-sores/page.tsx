import MySoresLayout from './my-sores-layout';
import { getUserDetails, getSores } from '@/lib/queries';
import { redirect } from 'next/navigation';
export default async function MySoresPage({
  searchParams
}: {
  searchParams: Promise<{ sore?: string }>;
}) {
  const user = await getUserDetails();

  if (!user) {
    redirect('/signin/password_signin');
  }

  const soresData = await getSores(user.id);

  const { sore } = await searchParams;

  return (
    <MySoresLayout
      user={user}
      soresData={soresData ?? []}
      // From History's "Show on map": open with that sore selected.
      initialSelectedId={sore ?? null}
    />
  );
}
