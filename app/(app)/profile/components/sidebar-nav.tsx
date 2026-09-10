'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/utils/cn';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: { href: string; title: string }[];
}

/**
 * Section navigation for Settings: a horizontally scrolling row of chips on
 * a phone, a vertical list from lg up.
 */
export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings sections"
      className={cn(
        'flex gap-1.5 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible',
        // The row can run past the screen edge; hide the scrollbar rather
        // than reserving a gutter for one that only appears on a trackpad.
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-10 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors',
              'lg:h-auto lg:rounded-md lg:px-3 lg:py-2',
              active
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground lg:bg-transparent lg:hover:bg-muted'
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
