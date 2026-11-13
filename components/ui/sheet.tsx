'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/utils/cn';

import { useSheetDrag } from './use-sheet-drag';

/**
 * A bottom sheet: what a phone app opens for a detail or a short edit,
 * where a website would open a page or a centred dialog.
 *
 * Built on the Radix dialog, so focus moves in and is held there, Escape
 * closes it, and the page behind is hidden from a screen reader. On top of
 * that: a grabber, swipe-down to close, a spring-like settle, and the home
 * indicator's safe area under the last control. A `half` sheet opens at
 * about half the screen and a swipe up takes it to full height.
 *
 * On a wide window it stays a sheet, centred and capped at a phone's width,
 * so a detail never stretches into a line 1,000px long.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  hideTitle = false,
  detent = 'auto',
  showClose = true,
  className,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Always set, for the screen reader; `hideTitle` keeps it off screen. */
  title: React.ReactNode;
  description?: React.ReactNode;
  hideTitle?: boolean;
  /** `auto` fits its content; `half` opens at half height and can grow. */
  detent?: 'auto' | 'half';
  /** Off for an action sheet, whose own Cancel is the way out. */
  showClose?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {open && (
        <SheetBody
          title={title}
          description={description}
          hideTitle={hideTitle}
          detent={detent}
          showClose={showClose}
          className={className}
          onClose={() => onOpenChange(false)}
        >
          {children}
        </SheetBody>
      )}
    </DialogPrimitive.Root>
  );
}

function SheetBody({
  title,
  description,
  hideTitle,
  detent,
  showClose,
  className,
  onClose,
  children
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  hideTitle: boolean;
  detent: 'auto' | 'half';
  showClose: boolean;
  className?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const { panelStyle, handleProps, attachBody, dismiss, leaving } =
    useSheetDrag({
      onDismiss: onClose,
      expanded,
      onExpandedChange: detent === 'half' ? setExpanded : undefined
    });

  return (
    <DialogPrimitive.Portal forceMount>
      <DialogPrimitive.Overlay
        forceMount
        className={cn(
          'fixed inset-0 z-50 bg-black/40 animate-scrim-in transition-opacity duration-200',
          leaving && 'opacity-0'
        )}
      />
      <DialogPrimitive.Content
        forceMount
        // The sheet closes with its own slide; Radix would unmount at once.
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          dismiss();
        }}
        // A control marked data-autofocus takes focus first (an action
        // sheet's Cancel, so Enter never confirms a destructive choice).
        onOpenAutoFocus={(e) => {
          const target = (
            e.currentTarget as HTMLElement | null
          )?.querySelector<HTMLElement>('[data-autofocus]');
          if (target) {
            e.preventDefault();
            target.focus();
          }
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          dismiss();
        }}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-lg flex-col',
          'rounded-t-worksheet bg-card text-card-foreground shadow-sheet outline-none',
          'animate-sheet-in',
          detent === 'half' && !expanded
            ? 'max-h-[58dvh]'
            : 'max-h-[calc(100dvh-var(--safe-top)-0.75rem)]',
          detent === 'half' &&
            expanded &&
            'h-[calc(100dvh-var(--safe-top)-0.75rem)]'
        )}
        style={panelStyle}
      >
        <div
          {...handleProps}
          className="relative shrink-0 cursor-grab px-4 pb-1 pt-2 active:cursor-grabbing"
        >
          <span
            aria-hidden="true"
            className="mx-auto block h-1.5 w-10 rounded-full bg-control/50"
          />
          <DialogPrimitive.Title
            className={cn(
              'mt-2 truncate pr-12 font-display text-subhead font-semibold',
              hideTitle && 'sr-only'
            )}
          >
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">
              Swipe down to close.
            </DialogPrimitive.Description>
          )}
          {showClose && (
            <button
              type="button"
              onClick={() => dismiss()}
              aria-label="Close"
              className="focus-ring absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground active:scale-95 tap-target"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
        <div
          ref={attachBody}
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(var(--safe-bottom)+1rem)] pt-2',
            className
          )}
        >
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
