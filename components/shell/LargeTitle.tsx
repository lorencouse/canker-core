'use client';

import { type ReactNode, useEffect, useRef } from 'react';

import { cn } from '@/utils/cn';

/**
 * A tab's large title, the way an installed app opens a screen: the name
 * set big at the top of the content, collapsing into the top bar's compact
 * title once it scrolls under the bar.
 *
 * No scroll listener: one IntersectionObserver watches the heading against
 * the bar's lower edge and flips `data-large-title` on the root, and CSS
 * (`.bar-title` in styles/main.css) does the rest. A screen without one
 * leaves the attribute unset, so its bar keeps its title.
 *
 * `children` is the heading text. `overline` sits above it (Today's date);
 * `accessory` sits at the heading's end (an "i"); `below` is the one short
 * line under it.
 */
export default function LargeTitle({
  children,
  overline,
  accessory,
  below,
  className
}: {
  children: ReactNode;
  overline?: ReactNode;
  accessory?: ReactNode;
  below?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = ref.current;
    if (!heading || typeof IntersectionObserver === 'undefined') return;
    const root = document.documentElement;
    const bar = document.querySelector<HTMLElement>('[data-app-bar]');
    // The bar is fixed, so its height is the strip the title slides under.
    const barBottom = bar ? Math.round(bar.getBoundingClientRect().bottom) : 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        root.dataset.largeTitle = entry.isIntersecting ? 'shown' : 'hidden';
      },
      { rootMargin: `-${barBottom}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(heading);
    return () => {
      observer.disconnect();
      delete root.dataset.largeTitle;
    };
  }, []);

  return (
    <header className={cn('fold:max-w-[var(--fold-col)]', className)}>
      {overline && (
        <p className="tabular text-sm font-semibold text-muted-foreground">
          {overline}
        </p>
      )}
      <div className="flex min-w-0 items-center gap-2">
        <h1
          ref={ref}
          className="min-w-0 truncate font-display text-large-title font-bold"
        >
          {children}
        </h1>
        {accessory}
      </div>
      {below && (
        <p className="tabular mt-0.5 truncate text-muted-foreground">{below}</p>
      )}
    </header>
  );
}
