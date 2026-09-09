'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '../lib/cn';

export interface SliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  /** Props spread onto every thumb (e.g. `aria-label`, `aria-valuetext`). */
  thumbProps?: React.ComponentProps<typeof SliderPrimitive.Thumb>;
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbProps,
  ...props
}: SliderProps) {
  const values = React.useMemo(
    () =>
      Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min],
    [value, defaultValue, min]
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        'relative flex w-full touch-none select-none items-center data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-2 data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-2"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
        />
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          data-slot="slider-thumb"
          {...thumbProps}
          className={cn(
            'border-primary bg-card hover:ring-ring/30 focus-visible:ring-ring focus-visible:ring-offset-background block size-6 shrink-0 rounded-full border-2 shadow-sm outline-none transition-[box-shadow] hover:ring-4 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
            thumbProps?.className
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
