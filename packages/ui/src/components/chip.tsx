import type * as React from 'react';

import { cn } from '../lib/cn';

export interface ChipProps extends Omit<
  React.ComponentProps<'button'>,
  'onToggle' | 'type' | 'aria-pressed'
> {
  selected?: boolean;
  onToggle?: (selected: boolean) => void;
  /** `add` renders a dashed "+ add" style chip. */
  variant?: 'default' | 'add';
}

/** A toggleable pill. Selected chips invert to foreground-on-background. */
function Chip({
  selected = false,
  onToggle,
  variant = 'default',
  className,
  children,
  onClick,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      data-slot="chip"
      data-selected={selected ? 'true' : undefined}
      aria-pressed={selected}
      className={cn(
        'focus-visible:ring-ring focus-visible:ring-offset-background inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*="size-"])]:size-3.5 [&_svg]:pointer-events-none [&_svg]:shrink-0',
        variant === 'add'
          ? 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground border-dashed bg-transparent'
          : selected
            ? 'border-foreground bg-foreground text-background'
            : 'border-border bg-card text-foreground hover:bg-muted',
        variant === 'add' &&
          selected &&
          'border-foreground bg-foreground text-background border-solid',
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onToggle?.(!selected);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export { Chip };
