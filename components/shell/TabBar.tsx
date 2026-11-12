'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { cn } from '@/utils/cn';
import { tap } from '@/utils/native';
import { APP_NAV, isActiveTab } from './nav-items';
import { useNativeTabBar } from './useNativeTabBar';

/**
 * The app's four tabs, in one of the three places utils/nav-mode.ts puts
 * them (<html data-nav>):
 *
 *   bar   a glass capsule floating over the foot of the content: any tall
 *         upright window (a phone, an iPad, a Surface Duo held upright).
 *         The width of a phone, and sized to its tabs and centred on
 *         anything wider (.tab-bar in styles/main.css). Fixed rather than
 *         sticky so it survives the address bar collapsing. In the app the
 *         platform draws its own bar in its place (native-tabs.ts).
 *   rail  a pill stood on end at the foot of the right edge: a short or
 *         wide touch window (a phone or iPad on its side, a Duo spanned
 *         with the hinge down the middle). Kouzr's rail, the same width
 *         (64px) and place: the tabs in the right thumb's reach, and on a
 *         spanned Duo on the second screen, clear of the hinge. The shell
 *         keeps its room as --safe-right (styles/main.css), so nothing else
 *         has to know it is there.
 *   top   hidden: a mouse from lg up has the same links in the top bar.
 */
export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = useMemo(
    () =>
      APP_NAV.map(({ href, label }) => ({
        id: href.slice(1),
        label,
        active: isActiveTab(pathname, href)
      })),
    [pathname]
  );
  useNativeTabBar(tabs, (id) => {
    const href = `/${id}`;
    tap();
    // The lit tab tapped again goes back to the top, as a native bar does.
    if (pathname === href) window.scrollTo({ top: 0, behavior: 'smooth' });
    else router.push(href);
  });

  return (
    <nav aria-label="Main" className="tab-bar keyboard-hides navtop:hidden">
      <ul className="flex h-full items-stretch p-1 rail:h-auto rail:flex-col">
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
                  'flex h-full flex-col items-center justify-center gap-1 rounded-full',
                  'rail:min-h-14 rail:px-1',
                  'text-xs transition-colors',
                  /*
                   * The active tab is ink and heavier, the rest muted. Weight
                   * and stroke carry it as well as colour, so it survives
                   * greyscale; indigo stays the colour of actions, not places.
                   */
                  active
                    ? 'bg-foreground/[0.07] font-semibold text-foreground'
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
