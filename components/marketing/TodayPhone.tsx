import Image from 'next/image';

import Kanko from '@/components/kanko/Kanko';

const ALT =
  'The Today screen: four days strong, this week’s check-ins, and two open sores with their size and pain';

/**
 * The home page hero is the product itself: the real Today screen, captured
 * from a demo account, in a plain phone frame, with the kind of finding
 * Insights surfaces laid over its corner. An abstract map told a visitor what
 * the app draws; this shows them what they will open every day.
 *
 * Both themes ship as separate captures, so the screen inside the frame
 * always matches the page around it. The frame crops the capture rather than
 * scaling it, so the text in it stays at a size that reads as a phone.
 *
 * The finding uses the wording Insights itself uses (components/insights/
 * triggers.ts), so the page promises nothing the app does not say.
 */
export default function TodayPhone() {
  return (
    <figure className="relative m-0 mx-auto w-full max-w-[21rem] pb-10 sm:pb-0">
      <div className="rounded-[2.75rem] bg-foreground p-2.5 dark:bg-streak">
        <div className="h-[27rem] overflow-hidden rounded-[2.2rem] sm:h-[31rem]">
          <Image
            src="/images/home/today-light.webp"
            alt={ALT}
            width={780}
            height={1460}
            priority
            sizes="21rem"
            className="h-auto w-full dark:hidden"
          />
          <Image
            src="/images/home/today-dark.webp"
            alt={ALT}
            width={780}
            height={1460}
            sizes="21rem"
            className="hidden h-auto w-full dark:block"
          />
        </div>
      </div>

      <figcaption className="absolute inset-x-2 bottom-0 flex items-center gap-3 rounded-[1.25rem] bg-accent px-4 py-3.5 text-foreground shadow-menu sm:-left-10 sm:bottom-10 sm:right-auto sm:w-[16.5rem]">
        {/* Cut-out art: the dark painted ground is the page's, not the
            accent card's, and would show as a square. */}
        <Kanko
          mood="magnify"
          size={52}
          transparent
          className="size-[3.25rem] shrink-0"
        />
        <span className="min-w-0">
          <span className="block font-display text-subhead font-bold leading-tight">
            Coffee came before 2 of 3 sores
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            Pattern, not proof
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
