'use client';

import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils/cn';

/**
 * A sheet: a panel that slides in from an edge.
 *
 * The bottom variant is the app's workhorse on a phone. It is the right
 * shape for secondary detail because it keeps the thing you tapped visible
 * above it — losing sight of the mouth map while adjusting a sore on it
 * would be the whole problem with using a full page here.
 *
 * Built on Radix's dialog, so focus trapping, escape, scroll locking and the
 * aria wiring are handled; this file is the presentation only.
 */

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px]',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  'fixed z-50 bg-card text-card-foreground shadow-lg transition ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300',
  {
    variants: {
      side: {
        bottom: cn(
          'inset-x-0 bottom-0 flex flex-col rounded-t-2xl border-t border-border',
          // Never taller than the screen less a thumb's worth of the page
          // behind it, so there is always something to tap to dismiss.
          'max-h-[85dvh]',
          // Padding, not margin: the sheet's own surface must reach the
          // bottom edge of the display, under the home indicator.
          'pb-[calc(var(--safe-bottom)+var(--keyboard-h))]',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom'
        ),
        right: cn(
          'inset-y-0 right-0 flex h-full w-3/4 max-w-sm flex-col border-l border-border',
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right'
        )
      }
    },
    defaultVariants: { side: 'bottom' }
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  /** The grabber. Suppress it where the sheet is not dismissible by drag. */
  showHandle?: boolean;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(
  (
    { side = 'bottom', showHandle = true, className, children, ...props },
    ref
  ) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {side === 'bottom' && showHandle && (
          // Purely an affordance: it says "this came from the bottom edge and
          // goes back there". Dismissal is the overlay tap and the close button.
          <div
            aria-hidden="true"
            className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-border"
          />
        )}
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

/** Fixed: stays put while the body scrolls under it. */
const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('shrink-0 px-5 pb-3 pt-4', className)} {...props} />
);

/**
 * The scrolling region. `min-h-0` is what actually makes it scroll: a flex
 * child's default `min-height: auto` refuses to shrink below its content,
 * so without it the body grows past the sheet's max height instead of
 * overflowing inside it. `overscroll-contain` keeps a flick at the end of
 * the list from scrolling the page behind the sheet.
 */
const SheetBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5',
      className
    )}
    {...props}
  />
);

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn(
      'font-display text-base font-semibold tracking-tight',
      className
    )}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetTitle,
  SheetDescription
};
