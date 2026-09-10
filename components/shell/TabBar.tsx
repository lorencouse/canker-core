'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/utils/cn';
import { tap } from '@/utils/native';
import { APP_NAV, isActiveTab } from './nav-items';

/**
 * The bottom tab bar: the app's primary navigation on a phone.
 *
 * Hidden from lg up, where the same destinations live in the top bar. It is
 * fixed rather than sticky so it survives the address bar collapsing, and it
 * sits above the home indicator via the safe-area padding rather than
 * guessing at a magic 34px.
 */
export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 lg:hidden',
        'border-t border-border bg-background/95 backdrop-blur-md',
        'safe-b safe-x'
      )}
      style={{ height: 'calc(var(--tab-bar-h) + var(--safe-bottom))' }}
    >
      <ul className="flex h-[var(--tab-bar-h)] items-stretch">
        {APP_NAV.map(({ href, label, description, icon: Icon }) => {
          const active = isActiveTab(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                onClick={() => tap()}
                aria-current={active ? 'page' : undefined}
                aria-label={description}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1',
                  'text-[11px] font-medium transition-colors',
                  // No hover state: this bar only ever exists under a thumb.
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {/*
                  The active state is carried by a filled pill behind the
                  icon rather than by colour alone, so it survives greyscale
                  and does not rely on the teal reading as "selected".
                */}
                <span
                  className={cn(
                    'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                    active ? 'bg-accent' : 'bg-transparent'
                  )}
                >
                  <Icon
                    className="size-5"
                    strokeWidth={active ? 2.25 : 1.75}
                    aria-hidden="true"
                  />
                </span>
                <span aria-hidden="true">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
