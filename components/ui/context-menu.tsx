'use client';

import type React from 'react';
import type { ComponentType } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/utils/cn';

export type MenuItem = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  destructive?: boolean;
  onSelect: () => void;
};

/** Gap kept between the menu and the window's edges. */
const EDGE = 12;

/**
 * A press-and-hold menu, the web's version of the one iOS and Android open
 * on a long press: a short floating list at the finger, growing out of the
 * point that was held.
 *
 * It is a real menu for a keyboard and a screen reader: it takes focus on
 * its first item, arrow keys move between items, Escape or a tap outside
 * closes it, and focus goes back to the control that opened it.
 */
export function ContextMenu({
  at,
  label,
  items,
  onClose
}: {
  /** Where it was opened, in client pixels; null when closed. */
  at: { x: number; y: number } | null;
  /** Names the menu for a screen reader, e.g. "Tongue sore". */
  label: string;
  items: MenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{ left: number; top: number } | null>(
    null
  );
  // The control that had focus when the menu opened, to give it back.
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const [openedAt, setOpenedAt] = useState(at);
  if (at !== openedAt) {
    setOpenedAt(at);
    setPlace(null);
    if (at && typeof document !== 'undefined')
      setOpener(
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      );
  }

  // Fit the menu inside the window, beside the point rather than under the finger.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!at || !el) return;
    const { width, height } = el.getBoundingClientRect();
    const left = Math.min(
      Math.max(EDGE, at.x - width / 2),
      window.innerWidth - width - EDGE
    );
    const below = at.y + 28;
    const top =
      below + height + EDGE < window.innerHeight
        ? below
        : Math.max(EDGE, at.y - height - 28);
    setPlace({ left, top });
  }, [at]);

  useEffect(() => {
    if (!at) return;
    ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    // Next tick: the release of the press that opened it is not "outside".
    const id = window.setTimeout(
      () => document.addEventListener('pointerdown', away),
      0
    );
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('pointerdown', away);
    };
  }, [at, onClose]);

  if (!at || typeof document === 'undefined') return null;

  const close = () => {
    onClose();
    opener?.focus({ preventScroll: true });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const all = Array.from(
      ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    );
    const i = all.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => all[(n + all.length) % all.length]?.focus();
    if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      go(i + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      go(i - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      go(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      go(all.length - 1);
    }
  };

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        'fixed z-[60] w-56 overflow-hidden rounded-worksheet bg-popover text-popover-foreground shadow-menu',
        place ? 'animate-pop-in' : 'invisible'
      )}
      style={{
        left: place?.left ?? 0,
        top: place?.top ?? 0,
        transformOrigin: place
          ? `${at.x - place.left}px ${at.y < place.top ? 0 : '100%'}`
          : undefined
      }}
    >
      {items.map(({ label: text, icon: Icon, destructive, onSelect }, i) => (
        <button
          key={text}
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            onSelect();
          }}
          className={cn(
            'flex h-12 w-full items-center justify-between gap-3 whitespace-nowrap px-4 text-left text-base font-semibold outline-none transition-colors focus-visible:bg-accent active:bg-accent',
            i > 0 && 'border-t border-border',
            destructive ? 'text-destructive' : 'text-foreground'
          )}
        >
          <span className="min-w-0 truncate">{text}</span>
          {Icon && (
            <span aria-hidden="true" className="contents">
              <Icon className="size-5 shrink-0" />
            </span>
          )}
        </button>
      ))}
    </div>,
    document.body
  );
}
