import MySoresLayout from './my-sores-layout';
import { getUserDetails } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
export default async function MySoresPage() {
  const supabase = await createClient();
  const user = await getUserDetails(supabase);

  if (!user) {
    redirect('/signin/password_signin');
  }

  const { data: soresData, error } = await supabase
    .from('sores')
    .select()
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching sores:', error.message);
    // You might want to handle this error more gracefully
    return <div>Error loading sores. Please try again later.</div>;
  }

  return <MySoresLayout user={user} soresData={soresData ?? []} />;
}
