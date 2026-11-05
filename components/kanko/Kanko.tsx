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
  const { src } = KANKO[mood];
  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      priority={priority}
      className={cn('kanko-fade select-none object-cover', className)}
    />
  );
}
