import { cn } from '@/utils/cn';

/** One tag: one line, 44px tall under a thumb, truncated rather than spilling. */
export function Chip({
  on,
  onClick,
  children
}: {
  on: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'focus-ring inline-flex h-10 max-w-full items-center whitespace-nowrap rounded-full border px-3.5 text-[15px] transition-colors coarse:h-11 lg:h-9 lg:text-sm',
        on
          ? 'border-primary bg-accent font-semibold text-foreground'
          : 'border-control bg-card text-foreground hover:bg-muted'
      )}
    >
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}
