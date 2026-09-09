import type * as React from 'react';

import { cn } from '../lib/cn';

export interface StatTileProps extends React.ComponentProps<'div'> {
  value: React.ReactNode;
  label: React.ReactNode;
  hint?: React.ReactNode;
}

/** Big display-font number with a small muted label; optional hint line. */
function StatTile({ value, label, hint, className, ...props }: StatTileProps) {
  return (
    <div
      data-slot="stat-tile"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-1 rounded-xl border px-4 py-3',
        className
      )}
      {...props}
    >
      <span className="tabular font-display text-3xl font-semibold leading-none tracking-tight">
        {value}
      </span>
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      {hint !== undefined && hint !== null ? (
        <span className="text-secondary-foreground text-xs">{hint}</span>
      ) : null}
    </div>
  );
}

export { StatTile };
