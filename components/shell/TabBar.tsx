'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/utils/cn';
import { tap } from '@/utils/native';
import { APP_NAV, isActiveTab } from './nav-items';

/**
 * The app's four tabs, in one of the three places utils/nav-mode.ts puts
 * them (<html data-nav>):
 *
 *   bar   along the bottom: every phone upright. Fixed rather than sticky so
 *         it survives the address bar collapsing, and above the home
 *         indicator through the safe-area padding.
 *   rail  a pill stood on end at the foot of the right edge: a Surface Duo,
 *         an iPad, any short wide touch screen. Kouzr's rail, the same width
 *         (64px) and place: the tabs in the right thumb's reach, and on a
 *         spanned Duo on the second screen, clear of the hinge. The shell
 *         keeps its room as --safe-right (styles/main.css), so nothing else
 *         has to know it is there.
 *   top   hidden: a mouse from lg up has the same links in the top bar.
 */
export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className={cn(
        'keyboard-hides fixed z-40 navtop:hidden',
        // Opaque: a frosted bar lets the content under it compete with the
        // labels.
        'border-border bg-card',
        'inset-x-0 bottom-0 h-[calc(var(--tab-bar-h)+var(--safe-bottom))] border-t safe-b safe-x',
        'rail:left-auto rail:right-[var(--rail-right)] rail:bottom-[calc(var(--safe-bottom)+var(--rail-gap))] rail:h-auto rail:w-[var(--rail-w)] rail:rounded-full rail:border rail:p-0'
      )}
    >
      <ul className="flex h-[var(--tab-bar-h)] items-stretch rail:h-auto rail:flex-col rail:py-1">
        {APP_NAV.map(({ href, label, description, icon: Icon }) => {
          const active = isActiveTab(pathname, href);
          return (
            <li key={href} className="min-w-0 flex-1 rail:flex-none">
              <Link
                href={href}
                onClick={() => tap()}
                aria-current={active ? 'page' : undefined}
                aria-label={description}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1',
                  'rail:min-h-14 rail:px-1',
                  'text-xs transition-colors',
                  /*
                   * The active tab is ink and heavier, the rest muted. Weight
                   * and stroke carry it as well as colour, so it survives
                   * greyscale; indigo stays the colour of actions, not places.
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
                <span aria-hidden="true" className="max-w-full truncate">
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
