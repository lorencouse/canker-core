export type KankoMood = 'proud' | 'hello' | 'curious' | 'gentle' | 'neutral';

/**
 * Square, 640px WebP, built by `npm run art:kanko`. `src` is transparent art
 * for light mode; `darkSrc` is opaque art drawn on the dark ground (the card
 * colour for curious, which sits inside cards).
 */
export const KANKO: Record<
  KankoMood,
  { src: string; darkSrc: string; width: number; height: number }
> = {
  proud: {
    src: '/images/kanko/kanko-proud.webp',
    darkSrc: '/images/kanko/kanko-proud-dark.webp',
    width: 640,
    height: 640
  },
  hello: {
    src: '/images/kanko/kanko-hello.webp',
    darkSrc: '/images/kanko/kanko-hello-dark.webp',
    width: 640,
    height: 640
  },
  curious: {
    src: '/images/kanko/kanko-curious.webp',
    darkSrc: '/images/kanko/kanko-curious-dark.webp',
    width: 640,
    height: 640
  },
  gentle: {
    src: '/images/kanko/kanko-gentle.webp',
    darkSrc: '/images/kanko/kanko-gentle-dark.webp',
    width: 640,
    height: 640
  },
  neutral: {
    src: '/images/kanko/kanko-neutral.webp',
    darkSrc: '/images/kanko/kanko-neutral-dark.webp',
    width: 640,
    height: 640
  }
};
