import type { SoreLog } from '@canker/core';

/**
 * Size and pain over a sore's life as two lines on one small chart. Size is
 * drawn against the left scale (mm), pain against a fixed 0..10 scale. Chart
 * text uses theme tokens so it reads in both themes.
 */
export function SoreSparkline({
  logs,
  height = 96
}: {
  logs: readonly SoreLog[];
  height?: number;
}) {
  const sorted = logs.slice().sort((a, b) => (a.log_date < b.log_date ? -1 : 1));
  if (sorted.length === 0) {
    return <p className="text-muted-foreground text-sm">No check-ins yet.</p>;
  }

  const W = 320;
  const H = height;
  const padL = 26;
  const padR = 26;
  const padY = 10;
  const innerW = W - padL - padR;
  const innerH = H - padY * 2;
  const maxSize = Math.max(5, ...sorted.map((l) => l.size_mm));
  const n = sorted.length;
  const x = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const ySize = (mm: number) => padY + innerH - (mm / maxSize) * innerH;
  const yPain = (p: number) => padY + innerH - (p / 10) * innerH;

  const sizePath = sorted
    .map(
      (l, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${ySize(l.size_mm).toFixed(1)}`
    )
    .join(' ');
  const painPath = sorted
    .map((l, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${yPain(l.pain).toFixed(1)}`)
    .join(' ');
  const last = sorted[n - 1]!;

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Size and pain over time"
      >
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={padL}
            x2={W - padR}
            y1={padY + innerH * t}
            y2={padY + innerH * t}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        <text x={2} y={padY + 4} fontSize={9} fill="var(--muted-foreground)">
          {maxSize}mm
        </text>
        <text x={2} y={padY + innerH + 3} fontSize={9} fill="var(--muted-foreground)">
          0
        </text>
        <text x={W - padR + 4} y={padY + 4} fontSize={9} fill="var(--muted-foreground)">
          10
        </text>
        <text
          x={W - padR + 4}
          y={padY + innerH + 3}
          fontSize={9}
          fill="var(--muted-foreground)"
        >
          0
        </text>
        <path
          d={sizePath}
          fill="none"
          stroke="var(--heal)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path
          d={painPath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <circle cx={x(n - 1)} cy={ySize(last.size_mm)} r={3.5} fill="var(--heal)" />
        <circle cx={x(n - 1)} cy={yPain(last.pain)} r={3.5} fill="var(--accent)" />
      </svg>
      <figcaption className="text-muted-foreground mt-1 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <i className="bg-heal inline-block h-2 w-2 rounded-full" /> Size (mm)
        </span>
        <span className="flex items-center gap-1.5">
          <i className="bg-accent inline-block h-2 w-2 rounded-full" /> Pain (0–10)
        </span>
      </figcaption>
    </figure>
  );
}
