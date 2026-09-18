import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
const buttonVariants = cva(
  /*
   * Square, condensed, uppercase, and it moves when you press it. A button
   * under the Chalk direction is a key on a machine rather than a rounded
   * chip: pressing translates it into its own shadow instead of fading its
   * opacity, which is the difference between a control that responds and
   * one that merely acknowledges.
   */
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-display text-sm font-semibold uppercase tracking-[0.09em] ring-offset-background transition-[filter,background-color,color] active:translate-x-px active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // The one filled button on a screen, and it is the one that writes
        // a reading. Two of these on a screen means one of them is wrong.
        default:
          'border-2 border-primary bg-primary text-primary-foreground shadow-drop-sm hover:brightness-110 active:shadow-none',
        /*
         * Destructive is stated in words, not painted red: red is the
         * severity ramp and nothing else, so a delete button that borrowed
         * it would make every pain dot on the screen mean less.
         */
        destructive:
          'border-2 border-rule bg-card text-foreground shadow-drop-sm hover:bg-muted active:shadow-none',
        outline: 'border-2 border-rule bg-transparent hover:bg-muted',
        secondary: 'border-2 border-transparent bg-muted text-foreground hover:bg-muted/80',
        ghost: 'border-2 border-transparent hover:bg-muted hover:text-foreground',
        // A link is prose, so it keeps the reading face and its own case.
        link: 'font-sans normal-case tracking-normal text-primary underline-offset-4 hover:underline',
        // Overlay controls that sit on top of the mouth diagram.
        overlay:
          'border-2 border-rule bg-card/90 text-foreground backdrop-blur hover:bg-card'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
        xs: 'h-8 px-2.5 text-xs',
        /*
         * Primary actions on a touch screen. 48px clears Apple's 44pt and
         * Android's 48dp minimums with room for the finger to be imprecise,
         * and steps back to a normal 40px control on a pointer device so a
         * desktop form is not built out of slabs.
         */
        touch: 'h-12 px-5 text-[15px] lg:h-10 lg:text-sm'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
export { Button, buttonVariants };
