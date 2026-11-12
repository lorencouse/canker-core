import type { CSSProperties } from 'react';

import { cn } from '@/utils/cn';

/**
 * The small marks that carry mood without words: a four-point sparkle and a
 * five-point star. One meaning each, kept everywhere:
 *
 *   star      you did it: a logged day, a healed sore, a streak.
 *   sparkle   a win is near: around Kanko and the moments he celebrates.
 *
 * Both are pure decoration beside words that already say the thing, so they
 * are hidden from assistive tech. Colour comes from the text colour, which
 * call sites set from the Momentum tokens (sunflower `text-win`, lavender
 * `text-comfort`). Never a severity colour: red is data.
 */

type MarkProps = { size?: number; className?: string; style?: CSSProperties };

export function SparkleMark({ size = 16, className, style }: MarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
      style={style}
    >
      <path
        fill="currentColor"
        d="M12 0c.6 5.8 3.2 9.4 12 12-8.8 2.6-11.4 6.2-12 12-.6-5.8-3.2-9.4-12-12 8.8-2.6 11.4-6.2 12-12z"
      />
    </svg>
  );
}

export function StarMark({ size = 16, className, style }: MarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
      style={style}
    >
      <path
        fill="currentColor"
        strokeLinejoin="round"
        d="M12 1.8l3.1 6.4 7 1-5.1 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5.1-5 7-1z"
      />
    </svg>
  );
}

export type Sparkle = {
  /** Position inside the parent, as CSS lengths (usually percentages). */
  top: string;
  left: string;
  size: number;
  shape?: 'sparkle' | 'star';
  tone?: 'win' | 'comfort';
  /** Seconds; staggers the twinkle so the marks do not pulse together. */
  delay?: number;
};

/**
 * A few marks scattered over a positioned parent. They twinkle (scale and
 * fade, transform and opacity only) and hold still under reduced motion
 * (`.twinkle` in styles/main.css). They never take a click.
 */
export function SparkleField({
  sparkles,
  className
}: {
  sparkles: Sparkle[];
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
    >
      {sparkles.map(
        ({ top, left, size, shape = 'sparkle', tone = 'win', delay = 0 }, i) => {
          const Mark = shape === 'star' ? StarMark : SparkleMark;
          return (
            <Mark
              key={i}
              size={size}
              className={cn(
                'twinkle absolute',
                tone === 'win' ? 'text-win' : 'text-comfort'
              )}
              style={{ top, left, animationDelay: `${delay}s` }}
            />
          );
        }
      )}
    </span>
  );
}
