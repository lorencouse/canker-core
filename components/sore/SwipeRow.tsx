'use client';

import { useRef, useState, type ReactNode } from 'react';
import { NotebookPen } from 'lucide-react';

import { StarMark } from '@/components/graphics/Sparkles';
import { cn } from '@/utils/cn';
import {
  rowSwipeAction,
  rowSwipeOffset,
  type RowSwipe
} from '@/utils/gestures';
import { tap } from '@/utils/native';

/** Movement before a touch is read as a swipe or a scroll, in CSS px. */
const SLOP_PX = 8;

type Gesture = {
  id: number;
  x: number;
  y: number;
  width: number;
  axis: 'x' | 'y' | null;
  armed: RowSwipe;
};

/**
 * A sore row that swipes, as a phone's mail list does: left for Healed,
 * right for Log. The action shows under the row as it slides; past the
 * threshold it is armed and the phone ticks once, and letting go there runs
 * it. Short of it the row springs back and nothing happens.
 *
 * The swipe is a shortcut, never the only way: the same two actions are
 * buttons on the sore's sheet and in its long-press menu. Vertical drags
 * stay the page's scroll (`touch-action: pan-y`), and a swipe never also
 * counts as a tap on the row.
 */
export default function SwipeRow({
  children,
  onHealed,
  onLog,
  className
}: {
  children: ReactNode;
  onHealed: () => void;
  onLog: () => void;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  // Set by a swipe so the click that ends it does not also open the row.
  const swiped = useRef(false);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [armed, setArmed] = useState<RowSwipe>(null);

  const reset = () => {
    gesture.current = null;
    setDragging(false);
    setDx(0);
    setArmed(null);
  };

  return (
    <div
      ref={box}
      className={cn('relative overflow-hidden', className)}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        swiped.current = false;
        gesture.current = {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          width: box.current?.offsetWidth ?? 320,
          axis: null,
          armed: null
        };
      }}
      onPointerMove={(e) => {
        const g = gesture.current;
        if (!g || g.id !== e.pointerId) return;
        const ddx = e.clientX - g.x;
        const ddy = e.clientY - g.y;
        if (g.axis === null) {
          if (Math.abs(ddx) > SLOP_PX && Math.abs(ddx) > Math.abs(ddy)) {
            g.axis = 'x';
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // A pointer the browser already let go of; the swipe still runs.
            }
            setDragging(true);
          } else if (Math.abs(ddy) > SLOP_PX) {
            gesture.current = null;
            return;
          } else return;
        }
        swiped.current = true;
        const next = rowSwipeAction(ddx, g.width);
        if (next !== g.armed) {
          g.armed = next;
          setArmed(next);
          // One tick on arming; none on disarming, which is backing out.
          if (next) tap('medium');
        }
        setDx(rowSwipeOffset(ddx, g.width));
      }}
      onPointerUp={(e) => {
        const g = gesture.current;
        if (!g || g.id !== e.pointerId) return;
        const action = g.axis === 'x' ? g.armed : null;
        reset();
        if (action === 'healed') onHealed();
        else if (action === 'log') onLog();
      }}
      onPointerCancel={reset}
      onClickCapture={(e) => {
        if (!swiped.current) return;
        swiped.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* What the swipe will do, under the row. Decorative: the buttons on
          the sore's sheet are the named way to the same two actions. */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 flex items-center px-4 text-base font-bold transition-colors',
          dx > 0 && 'justify-start',
          dx < 0 && 'justify-end',
          dx === 0 && 'invisible',
          dx > 0 &&
            (armed === 'log'
              ? 'bg-primary text-primary-foreground'
              : 'bg-accent text-foreground'),
          dx < 0 &&
            (armed === 'healed'
              ? 'bg-win text-win-foreground'
              : 'bg-muted text-foreground')
        )}
      >
        {dx > 0 ? (
          <span className="flex items-center gap-2">
            <NotebookPen className="size-5" />
            Log
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <StarMark
              size={20}
              className={armed === 'healed' ? undefined : 'text-win-edge'}
            />
            Healed
          </span>
        )}
      </div>
      <div
        className={cn(
          'relative touch-pan-y bg-card',
          !dragging && 'transition-[translate] duration-200 ease-out'
        )}
        style={{ translate: `${dx}px 0` }}
      >
        {children}
      </div>
    </div>
  );
}
