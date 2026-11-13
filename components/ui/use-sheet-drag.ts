'use client';

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Pixels of downward travel, or a flick, that closes a sheet. */
const CLOSE_DISTANCE = 110;
/** Pixels per millisecond: a flick that closes even a short drag. */
const CLOSE_VELOCITY = 0.55;
/** Upward travel that opens a half sheet to full height. */
const EXPAND_DISTANCE = 48;
/** How long the sheet takes to slide away before it is unmounted. */
export const SHEET_LEAVE_MS = 240;

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Swipe-down to close, and swipe-up to grow a half sheet, for a bottom sheet.
 *
 * The grabber and the header take a drag at once. The scrolling body takes
 * one only when it is scrolled to the top and the finger moves down more
 * than sideways, so a list still scrolls, and a ruler or slider inside still
 * drags sideways. Anything marked `data-no-sheet-drag` never starts one.
 *
 * Returns the offset to draw the panel at; the panel owns its own
 * transition, which this switches off while a finger is down so the sheet
 * tracks it exactly, and back on for the settle.
 */
export function useSheetDrag({
  onDismiss,
  expanded = false,
  onExpandedChange
}: {
  onDismiss: () => void;
  /** For a sheet that opens at half height: whether it is at full. */
  expanded?: boolean;
  /** Present only on a sheet that can grow. */
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const offsetRef = useRef(0);
  const track = useRef<{
    startY: number;
    lastY: number;
    lastT: number;
    velocity: number;
  } | null>(null);
  // A callback ref, so the touch listeners attach when the body mounts.
  const [body, attachBody] = useState<HTMLDivElement | null>(null);
  const growable = Boolean(onExpandedChange) && !expanded;

  const set = (y: number) => {
    offsetRef.current = y;
    setOffset(y);
  };

  const dismiss = useCallback(() => {
    if (reducedMotion()) {
      onDismiss();
      return;
    }
    setLeaving(true);
    window.setTimeout(onDismiss, SHEET_LEAVE_MS);
  }, [onDismiss]);

  const begin = (y: number) => {
    track.current = {
      startY: y,
      lastY: y,
      lastT: performance.now(),
      velocity: 0
    };
    setDragging(true);
  };

  const move = (y: number) => {
    const t = track.current;
    if (!t) return;
    const now = performance.now();
    t.velocity = (y - t.lastY) / Math.max(1, now - t.lastT);
    t.lastY = y;
    t.lastT = now;
    const d = y - t.startY;
    // Down follows the finger; up resists, a little less on a sheet that
    // can grow, so the pull reads as "there is more above".
    set(d >= 0 ? d : d * (growable ? 0.5 : 0.2));
  };

  const end = () => {
    const t = track.current;
    track.current = null;
    setDragging(false);
    if (!t) return;
    const d = offsetRef.current;
    if (d > CLOSE_DISTANCE || (d > 12 && t.velocity > CLOSE_VELOCITY)) {
      if (expanded && onExpandedChange) {
        onExpandedChange(false);
        set(0);
        return;
      }
      dismiss();
      return;
    }
    if (growable && d < -EXPAND_DISTANCE / 2) onExpandedChange?.(true);
    set(0);
  };

  /** For the grabber and header: the whole press is a sheet drag. */
  const handleProps = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if ((e.target as Element).closest('button, a, input, [data-no-sheet-drag]'))
        return;
      e.currentTarget.setPointerCapture(e.pointerId);
      begin(e.clientY);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (track.current) move(e.clientY);
    },
    onPointerUp: end,
    onPointerCancel: end,
    style: { touchAction: 'none' as const }
  };

  // The body: touch events, because a pointer handler would lose the finger
  // to the browser's own scroll the moment it moved.
  useEffect(() => {
    if (!body) return;
    let from: { x: number; y: number } | null = null;
    let claimed = false;
    const onStart = (e: TouchEvent) => {
      claimed = false;
      from = null;
      if (e.touches.length !== 1) return;
      if ((e.target as Element).closest('[data-no-sheet-drag], [role="slider"]'))
        return;
      if (body.scrollTop > 0) return;
      from = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onMove = (e: TouchEvent) => {
      if (!from) return;
      const { clientX, clientY } = e.touches[0];
      const dx = clientX - from.x;
      const dy = clientY - from.y;
      if (!claimed) {
        if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return;
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || body.scrollTop > 0) {
          from = null;
          return;
        }
        claimed = true;
        begin(from.y);
      }
      e.preventDefault();
      move(clientY);
    };
    const onEnd = () => {
      if (claimed) end();
      from = null;
      claimed = false;
    };
    body.addEventListener('touchstart', onStart, { passive: true });
    body.addEventListener('touchmove', onMove, { passive: false });
    body.addEventListener('touchend', onEnd);
    body.addEventListener('touchcancel', onEnd);
    return () => {
      body.removeEventListener('touchstart', onStart);
      body.removeEventListener('touchmove', onMove);
      body.removeEventListener('touchend', onEnd);
      body.removeEventListener('touchcancel', onEnd);
    };
    // begin/move/end read refs and setters only; re-binding on every
    // render would drop a drag in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, expanded, growable]);

  /** The panel's transform and transition for this frame. */
  const panelStyle: React.CSSProperties = {
    transform: leaving
      ? 'translateY(105%)'
      : offset !== 0
        ? `translateY(${offset}px)`
        : undefined,
    transition: dragging
      ? 'none'
      : `transform ${leaving ? SHEET_LEAVE_MS : 420}ms var(--ease-sheet), max-height 420ms var(--ease-sheet)`
  };

  return { panelStyle, handleProps, attachBody, dismiss, leaving, dragging };
}
