'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/utils/cn';
import { buttonVariants } from '@/components/ui/button';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'flex  flex-wrap space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 py-4 rounded-md gap-y-4',
        className
      )}
      {...props}
    >
      <span className="w-full">Update your profile:</span>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            pathname === item.href ? 'bg-foreground text-background ' : '',
            'justify-start outline outline-1 gap-2 hover:underline'
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
