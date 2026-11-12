import { Metadata } from 'next';

import BuildLabel from '@/components/BuildLabel';
import LargeTitle from '@/components/shell/LargeTitle';
import SignOutButton from '@/components/shell/SignOutButton';
import { SidebarNav } from './components/sidebar-nav';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Your profile, account and appearance preferences.'
};

const sidebarNavItems = [
  { title: 'Profile', href: '/profile' },
  { title: 'Account', href: '/profile/account' },
  { title: 'Appearance', href: '/profile/appearance' },
  { title: 'Reminders', href: '/profile/notifications' }
];

/**
 * Settings.
 *
 * The section nav is a sidebar on a desktop and a scrolling chip row on a
 * phone, pinned under the top bar. A phone settings screen is usually a
 * drill-down list, but four sections with a few fields each is not worth an
 * extra tap and a back button on every one of them.
 */
export default async function SettingsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fold-shell mx-auto max-w-6xl px-4 py-4 lg:px-6 lg:py-8">
      <LargeTitle className="mb-3 lg:mb-8">Settings</LargeTitle>

      {/* On a spanned Duo: the sections on the first screen, the one
          open on the second. */}
      <div className="fold-split flex flex-col gap-5 lg:flex-row lg:gap-14">
        <aside
          className={[
            // Sticky under the fixed top bar, so switching section does not
            // mean scrolling back up to find the nav again.
            'sticky top-[calc(var(--app-bar-h)+var(--safe-top))] z-10',
            '-mx-4 bg-background/95 px-4 py-2 backdrop-blur',
            'lg:static lg:mx-0 lg:w-56 lg:shrink-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none'
          ].join(' ')}
        >
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="min-w-0 flex-1 lg:max-w-2xl">
          {children}
          {/* Wherever the tabs are a bar or a rail: the top bar carries
              this only when it carries the links (navtop). */}
          <div className="mt-8 navtop:hidden">
            <SignOutButton />
          </div>
          <BuildLabel className="mt-8 block text-xs text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
