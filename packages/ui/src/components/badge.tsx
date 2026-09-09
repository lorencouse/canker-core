import type * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        heal: 'border-transparent bg-heal-soft text-heal',
        warn: 'border-transparent bg-warn-soft text-warn',
        /** Pain badge: colour comes from `level` (1..5). */
        pain: 'border-transparent'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export type PainLevel = 1 | 2 | 3 | 4 | 5;

/** Full class strings so Tailwind can see them at scan time. */
const PAIN_LEVEL_CLASSES: Record<PainLevel, string> = {
  1: 'bg-pain-1 text-pain-1-foreground',
  2: 'bg-pain-2 text-pain-2-foreground',
  3: 'bg-pain-3 text-pain-3-foreground',
  4: 'bg-pain-4 text-pain-4-foreground',
  5: 'bg-pain-5 text-pain-5-foreground'
};

export interface BadgeProps
  extends React.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  /** Pain bucket 1..5; only used with `variant="pain"`. */
  level?: PainLevel;
}

function Badge({ className, variant, level, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : 'span';
  return (
    <Comp
      data-slot="badge"
      data-level={variant === 'pain' ? level : undefined}
      className={cn(
        badgeVariants({ variant }),
        variant === 'pain' && PAIN_LEVEL_CLASSES[level ?? 3],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants, PAIN_LEVEL_CLASSES };
