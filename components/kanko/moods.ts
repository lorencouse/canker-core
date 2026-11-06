export type KankoMood =
  | 'proud'
  | 'hello'
  | 'curious'
  | 'gentle'
  | 'neutral'
  | 'point'
  | 'phone'
  | 'magnify'
  | 'reading'
  | 'lost'
  | 'medal'
  | 'envelope'
  | 'clipboard'
  | 'offline';

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
  },
  point: {
    src: '/images/kanko/kanko-point.webp',
    darkSrc: '/images/kanko/kanko-point-dark.webp',
    width: 640,
    height: 640
  },
  phone: {
    src: '/images/kanko/kanko-phone.webp',
    darkSrc: '/images/kanko/kanko-phone-dark.webp',
    width: 640,
    height: 640
  },
  magnify: {
    src: '/images/kanko/kanko-magnify.webp',
    darkSrc: '/images/kanko/kanko-magnify-dark.webp',
    width: 640,
    height: 640
  },
  reading: {
    src: '/images/kanko/kanko-reading.webp',
    darkSrc: '/images/kanko/kanko-reading-dark.webp',
    width: 640,
    height: 640
  },
  lost: {
    src: '/images/kanko/kanko-lost.webp',
    darkSrc: '/images/kanko/kanko-lost-dark.webp',
    width: 640,
    height: 640
  },
  medal: {
    src: '/images/kanko/kanko-medal.webp',
    darkSrc: '/images/kanko/kanko-medal-dark.webp',
    width: 640,
    height: 640
  },
  envelope: {
    src: '/images/kanko/kanko-envelope.webp',
    darkSrc: '/images/kanko/kanko-envelope-dark.webp',
    width: 640,
    height: 640
  },
  clipboard: {
    src: '/images/kanko/kanko-clipboard.webp',
    darkSrc: '/images/kanko/kanko-clipboard-dark.webp',
    width: 640,
    height: 640
  },
  offline: {
    src: '/images/kanko/kanko-offline.webp',
    darkSrc: '/images/kanko/kanko-offline-dark.webp',
    width: 640,
    height: 640
  }
};
