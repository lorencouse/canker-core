import { redirect } from 'next/navigation';

/**
 * Account used to be a page of its own. Its password, export and delete are
 * rows in the Settings list now; an old link lands there.
 */
export default function SettingsAccountPage() {
  redirect('/profile');
}
