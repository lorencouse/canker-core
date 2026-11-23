import Image from 'next/image';

import ExternalLink from '@/components/ui/Footer/ExternalLink';
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/utils/app-stores';
import { cn } from '@/utils/cn';

/**
 * The store badges, as each store ships them.
 *
 * Both badges are the stores' own artwork, unmodified: Google's and Apple's
 * badge rules forbid recolouring, cropping or redrawing them, which is why
 * they sit on the page as images rather than as one of our buttons.
 *
 * Google's PNG carries its required clear space inside the file (646x250,
 * the visible badge is about 564x168), so it is drawn taller than Apple's to
 * make the two visible badges the same height, as both stores ask.
 */
export default function StoreBadges({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-1 gap-y-2', className)}
    >
      <ExternalLink
        href={GOOGLE_PLAY_URL}
        className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Image
          src="/images/app/google-play-badge.png"
          alt="Get it on Google Play"
          width={646}
          height={250}
          className="h-[62px] w-auto"
        />
      </ExternalLink>

      {/* App Store slot: see APP_STORE_URL in utils/app-stores.ts. */}
      {APP_STORE_URL && (
        <ExternalLink
          href={APP_STORE_URL}
          className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src="/images/app/app-store-badge.svg"
            alt="Download on the App Store"
            width={120}
            height={40}
            className="h-[42px] w-auto"
          />
        </ExternalLink>
      )}
    </div>
  );
}
