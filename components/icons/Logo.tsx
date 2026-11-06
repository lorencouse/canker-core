import Image from 'next/image';
import { cn } from '@/utils/cn';

/**
 * Kanko's bust on an indigo tile with rounded corners (not a circle, so his body sits flush on the bottom edge), with the wordmark when asked. The wordmark
 * replaces the "Canker Core" text call sites used to set beside the old mark;
 * without it the face carries the accessible name itself.
 */
const Logo = ({
  className,
  size = 32,
  wordmark = false
}: {
  className?: string;
  size?: number;
  wordmark?: boolean;
}) => (
  <span className={cn('inline-flex items-center gap-2.5', className)}>
    <Image
      src="/images/kanko/kanko-face.webp"
      alt={wordmark ? '' : 'Canker Core'}
      width={size}
      height={size}
      className="shrink-0 rounded-[22%]"
      style={{ width: size, height: size }}
    />
    {wordmark && (
      <span className="font-display text-base font-extrabold tracking-tight">
        Canker Core
      </span>
    )}
  </span>
);

export default Logo;
