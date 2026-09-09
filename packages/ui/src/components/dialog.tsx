'use client';

import type * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '../lib/cn';

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal(props: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className
      )}
      {...props}
    />
  );
}

export interface DialogContentProps extends React.ComponentProps<
  typeof DialogPrimitive.Content
> {
  /**
   * Bottom-sheet mode: on small screens the panel anchors to the bottom edge with
   * rounded top corners and slides up; from `sm` upwards it behaves like a normal
   * centred dialog.
   */
  sheet?: boolean;
  /** Render the top-right close button (default true). */
  showCloseButton?: boolean;
}

const centredClasses =
  'top-1/2 left-1/2 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl sm:max-w-lg data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95';

const sheetClasses =
  'inset-x-0 bottom-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-2xl rounded-b-none pb-[calc(1.5rem+env(safe-area-inset-bottom))] data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom ' +
  'sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[85dvh] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:pb-6 ' +
  'sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95';

function DialogContent({
  className,
  children,
  sheet = false,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-sheet={sheet ? 'true' : undefined}
        className={cn(
          'bg-card text-card-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed z-50 grid gap-4 border p-6 shadow-lg outline-none duration-200',
          sheet ? sheetClasses : centredClasses,
          className
        )}
        {...props}
      >
        {sheet ? (
          <div
            aria-hidden
            className="bg-border mx-auto -mt-3 mb-1 h-1.5 w-10 rounded-full sm:hidden"
          />
        ) : null}
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="focus-visible:ring-ring absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('font-display text-lg font-semibold leading-none', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger
};
