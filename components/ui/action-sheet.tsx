'use client';

import * as React from 'react';

import { cn } from '@/utils/cn';
import { nativeActionSheet, tap, type ActionOption } from '@/utils/native';

import { Sheet } from './sheet';

type Ask = {
  title: string;
  message?: string;
  options: ActionOption[];
  resolve: (index: number | null) => void;
};

/**
 * An action sheet: a short list of choices rising from the bottom, the
 * destructive one in its own colour, Cancel apart from the rest.
 *
 * `ask` shows the system sheet when this app binary has the ActionSheet
 * plugin, and otherwise draws the same choices as a web sheet, so a site
 * update never depends on a store update. Render `sheet` once, anywhere in
 * the calling component.
 *
 *   const actions = useActionSheet();
 *   const i = await actions.ask('Delete this sore?', [{ title: 'Delete', style: 'destructive' }]);
 *   if (i === 0) remove();
 */
export function useActionSheet() {
  const [pending, setPending] = React.useState<Ask | null>(null);

  const ask = React.useCallback(
    async (
      title: string,
      options: ActionOption[],
      message?: string
    ): Promise<number | null> => {
      tap();
      const native = await nativeActionSheet(title, options, message);
      if (native !== 'unavailable') return native;
      return new Promise((resolve) =>
        setPending({ title, message, options, resolve })
      );
    },
    []
  );

  const answer = (index: number | null) => {
    pending?.resolve(index);
    setPending(null);
  };

  const sheet = (
    <Sheet
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) answer(null);
      }}
      title={pending?.title ?? ''}
      description={pending?.message}
      showClose={false}
    >
      <div className="grid gap-2">
        <div className="overflow-hidden rounded-cell bg-muted">
          {pending?.options.map((o, i) => (
            <button
              key={o.title}
              type="button"
              onClick={() => {
                tap();
                answer(i);
              }}
              className={cn(
                'focus-ring flex h-14 w-full items-center justify-center whitespace-nowrap px-4 text-[17px] font-semibold transition-colors active:bg-accent',
                i > 0 && 'border-t border-border',
                o.style === 'destructive' ? 'text-destructive' : 'text-primary'
              )}
            >
              <span className="min-w-0 truncate">{o.title}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          data-autofocus=""
          onClick={() => answer(null)}
          className="focus-ring flex h-14 w-full items-center justify-center rounded-cell bg-muted text-[17px] font-bold text-foreground transition-colors active:bg-accent"
        >
          Cancel
        </button>
      </div>
    </Sheet>
  );

  return { ask, sheet };
}
