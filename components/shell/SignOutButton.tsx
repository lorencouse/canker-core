'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SignOut } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';

/**
 * Sign out, for the phone layout.
 *
 * The desktop top bar carries this already; the tab bar deliberately does
 * not, because signing out is not a destination. Settings is where a phone
 * user goes looking for it, so it lives at the bottom of Settings.
 */
export default function SignOutButton() {
  const pathname = usePathname();
  const clientRouter = useRouter();
  const router = getRedirectMethod() === 'client' ? clientRouter : null;

  return (
    <form onSubmit={(e) => handleRequest(e, SignOut, router)}>
      <input type="hidden" name="pathName" value={pathname} />
      <Button type="submit" variant="outline" size="touch" className="w-full">
        <LogOut aria-hidden="true" />
        Sign out
      </Button>
    </form>
  );
}
