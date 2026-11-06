'use client';

import { useEffect } from 'react';

const MESSAGE =
  'You have readings that are not saved yet. Leave without saving?';

/**
 * Asks before leaving a screen with unsaved edits.
 *
 * The App Router has no navigation event to cancel, so in-app links are
 * caught on their way out: a capture-phase click listener sees the tab bar's
 * links before Next does, and a refused confirm stops the click there.
 * Closing or reloading the page is covered by beforeunload, which the browser
 * answers with its own wording.
 */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Older WebKit still wants returnValue set before it will ask.
      e.returnValue = '';
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      // A modified click opens a new tab and leaves this one where it is.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href]');
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target && link.target !== '_self') return;
      const to = new URL(link.href, window.location.href);
      const here = window.location;
      // Same page, or a jump within it, is not leaving.
      if (to.origin === here.origin && to.pathname === here.pathname) return;
      if (!window.confirm(MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);
}
