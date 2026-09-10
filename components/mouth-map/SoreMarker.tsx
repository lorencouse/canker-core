import type React from 'react';

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
  /** Arrow-key movement in percent of the view, only while draggable. */
  onNudge?: (dx: number, dy: number) => void;
}) {
  const level = Math.min(10, Math.max(1, Math.round(pain)));
  const fill = `hsl(var(--sev-${level}))`;

  const onKeyDown = (e: React.KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
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
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
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
