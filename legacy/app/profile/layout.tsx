import { Metadata } from 'next';
import Image from 'next/image';
import { getUserDetails } from '@/utils/supabase/queries';

import { Separator } from '@/components/ui/separator';
import { SidebarNav } from './components/sidebar-nav';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'User profile settings.'
};

const sidebarNavItems = [
  {
    title: 'Contact',
    href: '/profile'
  },
  {
    title: 'Account',
    href: '/profile/account'
  },
  {
    title: 'Appearance',
    href: '/profile/appearance'
  },
  {
    title: 'Notifications',
    href: '/profile/notifications'
  }
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({
  children
}: SettingsLayoutProps) {
  // const supabase = await createClient();
  // const profile = await getUserDetails(supabase);
  // const name = profile?.full_name || profile?.username || '';
  // const avartarUrl = profile?.avatar_url || '/images/logo.png';

  return (
    <>
      <div className=" space-y-6 p-10 pb-16 md:block">
        {/* <div className="welcome-box flex flex-row gap-4 items-center ">
          <Image
            src={avartarUrl}
            alt="Avatar"
            width={150}
            height={150}
            className="h-16 w-16 rounded-full"
          />
          <div className="flex flex-col gap-2">
            <span className="capitalize text-xl">Hello, {name}</span>
          </div>
        </div> */}
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and set e-mail preferences.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  );
}
