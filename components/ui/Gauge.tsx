import { SEVERITY_MAX, SEVERITY_MIN } from '@/utils/getColor';
import { cn } from '@/utils/cn';

/*
 * The arc dial: one measurement, shown against its ceiling.
 *
 * A bare number answers "how bad" but not "how bad out of what", and the
 * whole point of a 1-10 scale is the 10. The arc is 270 degrees with the
 * gap at the bottom, so a full reading still reads as nearly-closed rather
 * than closed, and there is somewhere obvious for the label to sit.
 *
 * The stroke thickens as the dial shrinks. At 40px a 13px stroke is most of
 * the radius, which is what keeps a list-sized dial readable when the number
 * inside it has been dropped.
 */

const R = 54;
const CIRCUMFERENCE = 2 * Math.PI * R;
const ARC = CIRCUMFERENCE * 0.75;

type Props = {
  /** Pain 1-10. */
  pain: number;
  /** Rendered width in px. The number is only drawn at 80 and above. */
  size?: number;
  /** Shown under the figure inside the dial. */
  label?: string;
  className?: string;
};

export default function Gauge({ pain, size = 132, label, className }: Props) {
  const clamped = Math.min(SEVERITY_MAX, Math.max(SEVERITY_MIN, Math.round(pain)));
  const fill = `hsl(var(--sev-${clamped}))`;
  const swept = (ARC * clamped) / SEVERITY_MAX;

  // Below 80px the figure would be smaller than the stroke around it, so the
  // arc carries the value alone and the number moves outside the component.
  const showsFigure = size >= 80;
  const stroke = size >= 120 ? 13 : size >= 80 ? 16 : 24;

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 128 128"
        width={size}
        height={size}
        role="img"
        aria-label={`Pain ${clamped} out of ${SEVERITY_MAX}`}
      >
        <circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
          strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
          transform="rotate(135 64 64)"
        />
        <circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke={fill}
          strokeWidth={stroke}
          strokeDasharray={`${swept} ${CIRCUMFERENCE}`}
          transform="rotate(135 64 64)"
        />
      </svg>

      {showsFigure && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display font-bold tabular leading-none"
            style={{ fontSize: size * 0.36 }}
          >
            {clamped}
          </span>
          {label && (
            <span className="label mt-1" style={{ fontSize: size * 0.085 }}>
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
