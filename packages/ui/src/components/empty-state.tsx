import type * as React from 'react';

import { cn } from '../lib/cn';

export interface EmptyStateProps extends Omit<React.ComponentProps<'div'>, 'title'> {
  /** An icon element, e.g. `<Smile />` from lucide-react. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  /** Usually a `<Button>`. */
  action?: React.ReactNode;
}

function EmptyState({ icon, title, body, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center',
        className
      )}
      {...props}
    >
      {icon ? (
        <div
          aria-hidden
          className="bg-accent-soft text-accent flex size-12 items-center justify-center rounded-full [&_svg]:size-6"
        >
          {icon}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-foreground text-lg font-semibold">{title}</h3>
        {body ? (
          <p className="text-muted-foreground max-w-prose text-sm">{body}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
