'use client';

import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Info, X } from 'lucide-react';

import { cn } from '@/utils/cn';
import { tap } from '@/utils/native';

/**
 * The "i": where an explainer sentence goes so the screen itself can stay a
 * label and a number. A small round button beside a heading opens a short
 * sheet from the bottom on a phone (a centred card on a wider window) with
 * the heading again and the sentences that used to sit on the page.
 *
 * Radix Dialog does the hard parts: focus moves into the sheet and back to
 * the "i", Escape and a tap outside close it, and the page behind is inert.
 */
export default function InfoButton({
  title,
  label,
  children,
  className
}: {
  /** The sheet's heading: usually the name of the thing it explains. */
  title: string;
  /** The button's accessible name, e.g. "About the mouth map". */
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        aria-label={label ?? `About ${title.toLowerCase()}`}
        onClick={() => tap()}
        className={cn(
          'tap-target inline-grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors',
          'hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
      >
        <Info aria-hidden="true" className="size-5" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 rounded-t-worksheet bg-card px-5 pt-3 text-card-foreground shadow-lg',
            'pb-[calc(var(--safe-bottom)+1.5rem)] pl-[calc(var(--safe-left)+1.25rem)] pr-[calc(var(--safe-right)+1.25rem)]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            // A wider window: a small card in the middle, not a sheet.
            'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-worksheet sm:p-6',
            'sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0'
          )}
        >
          {/* The grabber says "sheet" at a glance; it is not a control. */}
          <div
            aria-hidden="true"
            className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden"
          />
          <div className="flex items-start gap-3">
            <DialogPrimitive.Title className="min-w-0 flex-1 text-subhead font-semibold">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className="tap-target -mr-1 -mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden="true" className="size-5" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description asChild>
            <div className="prose-measure mt-2 space-y-2 text-muted-foreground">
              {children}
            </div>
          </DialogPrimitive.Description>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
