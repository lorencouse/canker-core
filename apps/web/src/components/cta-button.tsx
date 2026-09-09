import type { ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface CtaButtonProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Force an external anchor (opens same tab). Auto-detected for http(s) hrefs. */
  external?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-foreground hover:brightness-110 dark:hover:brightness-95 shadow-sm shadow-accent/20',
  secondary: 'border border-border bg-card text-foreground hover:bg-muted',
  ghost: 'text-secondary-foreground hover:bg-muted hover:text-foreground'
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-[0.95rem]'
};

export function CtaButton({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className,
  external
}: CtaButtonProps) {
  const classes = clsx(
    'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap motion-safe:transition-[background-color,filter,color]',
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  const isExternal = external ?? /^https?:\/\//.test(href);

  if (isExternal) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
