import type React from 'react';
import { sevFill } from '@/utils/severity';

/**
 * One sore on the map. Fill is the pain colour; the ring and glow separate it
 * from the tissue underneath. Rendered inside the camera group, so it moves
 * and scales with the artwork.
 *
 * It is also a real control: focusable, named for a screen reader, selected
 * with Enter or Space, and — in an editing mode — nudged with the arrow keys.
 * The pointer path is the fast one; this is the one that works for everyone.
 */
export default function SoreMarker({
  x,
  y,
  radius,
  pain,
  label,
  selected,
  draggable,
  filterId,
  onPointerDown,
  onSelect,
  onActivate,
  onMenu,
  onNudge
}: {
  x: number;
  y: number;
  radius: number;
  pain: number;
  /** Spoken name, e.g. "Tongue, 4 mm, pain 6 of 10". */
  label: string;
  selected: boolean;
  draggable: boolean;
  filterId: string;
  onPointerDown: (e: React.PointerEvent<SVGGElement>) => void;
  onSelect: () => void;
  /** Enter or Space: what a tap does, for a keyboard. */
  onActivate?: () => void;
  /**
   * The sore's menu, at a point in client pixels: a long press does this on
   * the map; here a right click, the Menu key or Shift+F10 does it.
   */
  onMenu?: (at: { x: number; y: number }) => void;
  /** Arrow-key movement in percent of the view, only while draggable. */
  onNudge?: (dx: number, dy: number) => void;
}) {
  const fill = sevFill(pain);

  const menuAtSelf = (el: Element) => {
    const box = el.getBoundingClientRect();
    onMenu?.({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
  };

  const onKeyDown = (e: React.KeyboardEvent<SVGGElement>) => {
    if (onMenu && (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey))) {
      e.preventDefault();
      menuAtSelf(e.currentTarget);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      (onActivate ?? onSelect)();
      return;
    }
    if (!draggable || !onNudge) return;
    const step = e.shiftKey ? 5 : 1;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    onSelect();
    onNudge(...move);
  };

  return (
    <g
      data-sore=""
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      aria-haspopup={onMenu ? 'menu' : undefined}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => {
        if (!onMenu) return;
        e.preventDefault();
        // A long press on touch opens the menu itself; this is the mouse's.
        if ((e.nativeEvent as PointerEvent).pointerType === 'touch') return;
        onMenu({ x: e.clientX, y: e.clientY });
      }}
      onFocus={onSelect}
      className="outline-none"
      style={{ cursor: draggable ? 'move' : 'pointer' }}
    >
      {/* Soft halo, so a pale sore still reads against pale tissue. */}
      <circle
        cx={x}
        cy={y}
        r={radius + 2}
        fill={fill}
        opacity="0.28"
        filter={`url(#${filterId})`}
      />
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={fill}
        stroke={
          selected ? 'hsl(var(--foreground))' : 'hsl(var(--foreground) / 0.45)'
        }
        strokeWidth={selected ? 2 : 1}
      />
      {selected && (
        <circle
          cx={x}
          cy={y}
          r={radius + 6}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.6"
        />
      )}
      {/* Generous invisible hit area for fingers. */}
      <circle cx={x} cy={y} r={Math.max(radius + 6, 14)} fill="transparent" />
    </g>
  );
}
