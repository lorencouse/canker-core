'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/utils/cn';

type SliderProps = React.ComponentPropsWithoutRef<
  typeof SliderPrimitive.Root
> & {
  /**
   * 'severity' paints the filled track red, and is only correct for controls
   * that actually measure pain. Anything else stays on the neutral action
   * colour so red keeps meaning one thing across the product.
   */
  tone?: 'default' | 'severity';
};

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, tone = 'default', ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      // py-2 is the invisible half: it widens the row a finger has to hit
      // without moving the track, which stays 8px tall.
      'relative flex w-full touch-none select-none items-center py-2',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
      <SliderPrimitive.Range
        className={cn(
          'absolute h-full',
          tone === 'severity' ? 'bg-destructive' : 'bg-primary'
        )}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        // 24px under a thumb, 20px under a cursor. A slider is the one
        // control where the handle really does have to be caught first time.
        'tap-target block size-6 rounded-full border-2 bg-card shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 lg:size-5',
        tone === 'severity' ? 'border-destructive' : 'border-primary'
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
