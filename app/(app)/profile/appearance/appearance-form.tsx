'use client';

import { useTheme } from 'next-themes';
import { Check, Monitor, Moon, Sun } from 'lucide-react';

import { cn } from '@/utils/cn';
import { Label } from '@/components/ui/label';
import { useMounted } from '@/utils/hooks/useMounted';

const OPTIONS = [
  {
    value: 'light',
    label: 'Light',
    description: 'Sores read as darker marks.',
    icon: Sun
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Sores read as brighter marks.',
    icon: Moon
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follow your device setting.',
    icon: Monitor
  }
] as const;

/**
 * Applies immediately rather than behind a save button: the change is visible
 * the moment it is made, so a confirmation step would only add a click.
 */
export function AppearanceForm() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div className="space-y-4">
      <Label>Theme</Label>
      <div
        role="radiogroup"
        aria-label="Theme"
        className="grid gap-3 sm:grid-cols-3"
      >
        {OPTIONS.map(({ value, label, description, icon: Icon }) => {
          const selected = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(value)}
              className={cn(
                'rounded-lg border p-4 text-left transition-colors',
                selected
                  ? 'border-primary bg-accent'
                  : 'border-border hover:bg-muted'
              )}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5" />
                {selected && <Check className="h-4 w-4 text-primary" />}
              </div>
              <p className="mt-3 font-medium">{label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        {mounted && theme === 'system'
          ? `Following your device, which is currently ${resolvedTheme}.`
          : 'Saved to this browser.'}
      </p>
    </div>
  );
}
