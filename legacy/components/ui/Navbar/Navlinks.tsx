'use client';

import Link from 'next/link';
import { SignOut } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import Logo from '@/components/icons/Logo';
import { usePathname, useRouter } from 'next/navigation';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import s from './Navbar.module.css';
import ModeToggle from '@/components/mode-toggle';

interface NavlinksProps {
  user?: any;
}

import { Menu } from 'lucide-react'; // Add this import
import { useState } from 'react';

export default function Navlinks({ user }: NavlinksProps) {
  const router = getRedirectMethod() === 'client' ? useRouter() : null;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex flex-row justify-between py-4 align-center">
      <div className="flex items-center flex-1">
        <Link href="/" className={s.logo} aria-label="Logo">
          <Logo />
        </Link>

        {/* Hamburger button */}
        <button
          className="lg:hidden ml-4 p-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>

        {/* Navigation links - desktop */}
        <nav className="hidden lg:flex ml-6 space-x-2">
          <Link href="/" className={s.link}>
            Home
          </Link>
          {user && (
            <>
              <Link href="/my-sores" className={s.link}>
                Sores
              </Link>
              <Link href="/history" className={s.link}>
                History
              </Link>
              <Link href="/profile" className={s.link}>
                Profile
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Mobile menu */}
      <nav
        className={`${
          isOpen ? 'flex' : 'hidden'
        } lg:hidden absolute top-full left-0 flex-col bg-background border-b border-zinc-200 dark:border-zinc-800 py-4 px-6 space-y-4 w-full`}
        onClick={() => setTimeout(() => setIsOpen(false), 1000)}
      >
        <Link href="/" className={s.link}>
          Home
        </Link>
        {user && (
          <>
            <Link href="/my-sores" className={s.link}>
              Sores
            </Link>
            <Link href="/history" className={s.link}>
              History
            </Link>
            <Link href="/profile" className={s.link}>
              Profile
            </Link>
          </>
        )}
        {user ? (
          <form onSubmit={(e) => handleRequest(e, SignOut, router)}>
            <input type="hidden" name="pathName" value={usePathname()} />
            <button type="submit" className={s.link}>
              Sign out
            </button>
          </form>
        ) : (
          <Link href="/signin" className={s.link}>
            Sign In
          </Link>
        )}
      </nav>

      {/* Desktop auth buttons and theme toggle */}
      <div className="hidden lg:flex justify-end space-x-8 items-center">
        {user ? (
          <form onSubmit={(e) => handleRequest(e, SignOut, router)}>
            <input type="hidden" name="pathName" value={usePathname()} />
            <button type="submit" className={s.link}>
              Sign out
            </button>
          </form>
        ) : (
          <Link href="/signin" className={s.link}>
            Sign In
          </Link>
        )}
        <ModeToggle />
      </div>

      {/* Mobile theme toggle */}
      <div className="lg:hidden flex items-center">
        <ModeToggle />
      </div>
    </div>
  );
}
