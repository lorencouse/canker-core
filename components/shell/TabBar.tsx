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
        // Opaque: a frosted bar lets the content under it compete with the
        // labels.
        'border-t border-border bg-card',
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
                  'text-xs transition-colors',
                  /*
                   * The active tab is ink and heavier, the rest muted. Weight
                   * and stroke carry it as well as colour, so it survives
                   * greyscale; teal stays the colour of actions, not places.
                   */
                  active
                    ? 'font-semibold text-foreground'
                    : 'font-medium text-muted-foreground'
                )}
              >
                <Icon
                  className="size-[1.375rem]"
                  strokeWidth={active ? 2.25 : 1.75}
                  aria-hidden="true"
                />
                <span aria-hidden="true" className="whitespace-nowrap">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
