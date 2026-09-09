import type React from 'react';

/**
 * One sore on the map. Fill is the pain colour; the ring and glow separate it
 * from the tissue underneath. Rendered inside the camera group, so it moves
 * and scales with the artwork.
 */
export default function SoreMarker({
  x, y, radius, pain, selected, draggable, filterId, onPointerDown
}: {
  x: number;
  y: number;
  radius: number;
  pain: number;
  selected: boolean;
  draggable: boolean;
  filterId: string;
  onPointerDown: (e: React.PointerEvent<SVGGElement>) => void;
}) {
  const level = Math.min(10, Math.max(1, Math.round(pain)));
  const fill = `hsl(var(--sev-${level}))`;
  return (
    <g
      data-sore=""
      onPointerDown={onPointerDown}
      style={{ cursor: draggable ? 'move' : 'pointer' }}
    >
      {/* Soft halo, so a pale sore still reads against pale tissue. */}
      <circle cx={x} cy={y} r={radius + 2} fill={fill} opacity="0.28" filter={`url(#${filterId})`} />
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={fill}
        stroke={selected ? 'hsl(var(--foreground))' : 'hsl(var(--foreground) / 0.45)'}
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
