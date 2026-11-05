export type KankoMood = 'proud' | 'hello' | 'curious' | 'gentle' | 'neutral';

/** Square, 640px WebP, built by `npm run art:kanko`. */
export const KANKO: Record<
  KankoMood,
  { src: string; width: number; height: number }
> = {
  proud: { src: '/images/kanko/kanko-proud.webp', width: 640, height: 640 },
  hello: { src: '/images/kanko/kanko-hello.webp', width: 640, height: 640 },
  curious: { src: '/images/kanko/kanko-curious.webp', width: 640, height: 640 },
  gentle: { src: '/images/kanko/kanko-gentle.webp', width: 640, height: 640 },
  neutral: { src: '/images/kanko/kanko-neutral.webp', width: 640, height: 640 }
};
