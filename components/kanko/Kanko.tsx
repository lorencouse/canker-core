import Image from 'next/image';

import { cn } from '@/utils/cn';

import { KANKO, type KankoMood } from './moods';

/**
 * The mascot. Always decorative: the screen's words carry the meaning, so the
 * image is hidden from assistive tech and never the only signal of a state.
 */
export default function Kanko({
  mood,
  size,
  className,
  priority
}: {
  mood: KankoMood;
  size: number;
  className?: string;
  priority?: boolean;
}) {
  const { src, darkSrc } = KANKO[mood];
  // Light mode uses transparent art; dark mode uses art drawn natively on the
  // dark ground, so there is no cut-out edge or clipped shadow to show.
  const shared = {
    'aria-hidden': true as const,
    width: size,
    height: size,
    priority,
    // Already sized, compressed WebP; the optimizer would re-encode it
    // (and drop the light art's transparency).
    unoptimized: true
  };
  return (
    <>
      <Image
        {...shared}
        alt=""
        src={src}
        className={cn('select-none object-cover dark:hidden', className)}
      />
      <Image
        {...shared}
        alt=""
        src={darkSrc}
        className={cn('hidden select-none object-cover dark:block', className)}
      />
    </>
  );
}
