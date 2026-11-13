import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Your profile, reminders, appearance and account.'
};

/**
 * Settings: one grouped list at /profile, with Reminders and Appearance
 * pushed as screens of their own and the short edits in sheets, the way a
 * phone's own Settings works. A column a phone wide at every size, since a
 * list of rows stretched across a desktop is a row of gaps.
 */
export default function SettingsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fold-shell fold-first mx-auto max-w-lg px-4 py-4 lg:py-8">
      {children}
    </div>
  );
}
