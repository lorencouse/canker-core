import type { ComponentType } from 'react';

import { cn } from '@/utils/cn';

/**
 * One tag: one line, 44px tall under a thumb, truncated rather than spilling.
 * An icon goes before the label when one says the same thing at a glance;
 * `win` is the sunflower state, for a choice that is good news (healed).
 */
export function Chip({
  on,
  onClick,
  icon: Icon,
  tone = 'default',
  disabled,
  children
}: {
  on: boolean;
  onClick: () => void;
  /** A lucide line icon, or a mark from components/graphics. */
  icon?: ComponentType<{ className?: string }>;
  tone?: 'default' | 'win';
  disabled?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'focus-ring inline-flex h-10 max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[15px] press disabled:opacity-50 coarse:h-11 lg:h-9 lg:text-sm',
        Icon && 'pl-3',
        on
          ? tone === 'win'
            ? 'border-win-edge bg-win font-semibold text-win-foreground'
            : 'border-primary bg-accent font-semibold text-foreground'
          : 'border-control bg-card text-foreground hover:bg-muted'
      )}
    >
      {Icon && (
        <span aria-hidden="true" className="contents">
          <Icon
            className={cn(
              'size-4 shrink-0',
              on
              ? 'text-current'
              : tone === 'win'
                ? 'text-win-edge'
                : 'text-muted-foreground'
            )}
          />
        </span>
      )}
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}
