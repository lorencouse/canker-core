import { redirect } from 'next/navigation';

import WelcomeFlow from '@/components/onboarding/WelcomeFlow';
import { getOnboardedAt, getUser } from '@/lib/queries';

export const metadata = { title: 'Welcome' };

/**
 * The first-run flow.
 *
 * Guarded on the way in as well as on the way out: someone who has already
 * been introduced and then types /welcome should land in the app, not be
 * walked through placing a sore they do not have.
 */
export default async function WelcomePage() {
  const user = await getUser();
  if (!user) return redirect('/signin');
  if (await getOnboardedAt(user.id)) return redirect('/today');

  return <WelcomeFlow user={user} />;
}
