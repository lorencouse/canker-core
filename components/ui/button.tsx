import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
const buttonVariants = cva(
  /*
   * Rounded and pressable. A button is a chunky key with a coloured edge
   * under it: pressing moves it down by most of the edge and drops the edge,
   * so it feels pushed in rather than faded. Only the filled and outlined
   * variants carry an edge, so only they move; secondary, ghost and link
   * stay flat and still, since a flat thing sinking into nothing reads as
   * a glitch.
   *
   * A label is one line, always: nowrap, capped at its container, and a
   * label wrapped in a <span> ellipsises rather than spilling out. A button
   * two lines tall reads as a paragraph, not a control.
   */
  'inline-flex max-w-full items-center justify-center gap-2 whitespace-nowrap [&>span]:min-w-0 [&>span]:truncate rounded-2xl font-sans text-sm font-extrabold ring-offset-background transition-[transform,box-shadow,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // The one filled button on a screen, and it is the one that writes
        // a reading. Two of these on a screen means one of them is wrong.
        default:
          'bg-primary text-primary-foreground shadow-press hover:brightness-110 active:translate-y-[3px] active:shadow-none',
        /*
         * Destructive is stated in words, not painted red: red is the
         * severity ramp and nothing else, so a delete button that borrowed
         * it would make every pain dot on the screen mean less.
         */
        destructive:
          'border-2 border-border bg-card text-foreground shadow-press-line hover:bg-muted active:translate-y-[3px] active:shadow-none',
        outline:
          'border-2 border-border bg-card shadow-press-line hover:bg-muted active:translate-y-[3px] active:shadow-none',
        secondary:
          'bg-muted text-foreground hover:bg-muted/80',
        ghost: 'hover:bg-muted hover:text-foreground',
        // A link is prose, so it reads as text with an underline.
        link: 'text-primary underline-offset-4 hover:underline',
        // Overlay controls that sit on top of the mouth diagram.
        overlay:
          'border-2 border-border bg-card text-foreground shadow-press-line hover:bg-muted active:translate-y-[3px] active:shadow-none'
      },
      /*
       * Sizes under 44px keep their drawing but get tap-target's invisible
       * 44px hit area, so a compact control is still hittable by a thumb.
       */
      size: {
        default: 'tap-target h-10 px-4 py-2',
        sm: 'tap-target h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'tap-target h-10 w-10',
        xs: 'tap-target h-8 px-2.5 text-xs',
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
        className={cn(
          buttonVariants({ variant, size, className }),
          'whitespace-nowrap'
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
export { Button, buttonVariants };
