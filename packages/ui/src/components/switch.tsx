'use client';

import type * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '../lib/cn';

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'shadow-xs focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=unchecked]:bg-border peer inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-transparent outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-card pointer-events-none block size-5 rounded-full shadow ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
