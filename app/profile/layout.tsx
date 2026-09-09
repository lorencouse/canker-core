import { Metadata } from 'next';

import { Separator } from '@/components/ui/separator';
import { SidebarNav } from './components/sidebar-nav';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Your account, contact details, and appearance preferences.'
};

const sidebarNavItems = [
  { title: 'Contact', href: '/profile' },
  { title: 'Account', href: '/profile/account' },
  { title: 'Appearance', href: '/profile/appearance' },
  { title: 'Notifications', href: '/profile/notifications' }
];

export default async function SettingsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container py-8">
      <header>
        <h1 className="text-title">Settings</h1>
        <p className="prose-measure mt-2 text-muted-foreground">
          Your details, how the app looks, and what it emails you about.
        </p>
      </header>

      <Separator className="my-8" />

      <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
        <aside className="lg:w-56 lg:shrink-0">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="min-w-0 flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
