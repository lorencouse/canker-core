'use client';

import { useTheme } from 'next-themes';
import { Check, Monitor, Moon, Sun } from 'lucide-react';

import { cn } from '@/utils/cn';
import { useMounted } from '@/utils/hooks/useMounted';
import { tap } from '@/utils/native';

import { Tile, type TileColor } from '../components/grouped-list';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun, color: 'amber' },
  { value: 'dark', label: 'Dark', icon: Moon, color: 'indigo' },
  { value: 'system', label: 'System', icon: Monitor, color: 'slate' }
] as const satisfies ReadonlyArray<{
  value: string;
  label: string;
  icon: typeof Sun;
  color: TileColor;
}>;

/**
 * A checkmark list, as a phone's own settings pick one of a few. Applies
 * the moment it is tapped: the change is visible at once, so a Save would
 * only add a step.
 */
export function AppearanceForm() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div className="grid gap-2">
      <div
        role="radiogroup"
        aria-label="Theme"
        className="overflow-hidden rounded-worksheet bg-card"
      >
        {OPTIONS.map(({ value, label, icon, color }, i) => {
          const selected = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                tap();
                setTheme(value);
              }}
              className="focus-ring flex w-full items-center gap-3 pl-4 text-left transition-[transform,background-color] duration-150 hover:bg-muted/60 active:scale-[0.99] active:bg-muted"
            >
              <Tile icon={icon} color={color} />
              <span
                className={cn(
                  'flex min-h-14 min-w-0 flex-1 items-center gap-3 pr-4',
                  i > 0 && 'border-t border-border'
                )}
              >
                <span className="min-w-0 flex-1 truncate text-base font-semibold">
                  {label}
                </span>
                <Check
                  aria-hidden="true"
                  className={cn(
                    'size-5 shrink-0 text-primary transition-opacity',
                    selected ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </span>
            </button>
          );
        })}
      </div>
      {mounted && theme === 'system' && resolvedTheme && (
        <p className="px-4 text-sm text-muted-foreground">
          Now {resolvedTheme}.
        </p>
      )}
    </div>
  );
}
