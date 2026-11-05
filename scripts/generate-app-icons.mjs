/**
 * Generates the PNG app icons and splash screens from Kanko's face.
 *
 * Source: docs/superpowers/specs/assets/2026-11-05-kanko/kanko-app-icon.webp,
 * 1024x1024, the face on solid indigo (#4B4BF0) edge to edge. Because the
 * ground is solid, icons crop and scale it directly with no transparency work.
 *
 *   node scripts/generate-app-icons.mjs
 *
 * Output:
 *   public/icons/icon-192.png, icon-512.png  PWA manifest icons.
 *   public/icons/icon-maskable-512.png       Android maskable: the face is
 *     scaled into the 80% safe zone on solid indigo that bleeds to the edge.
 *   public/icons/apple-touch-icon.png        180px, fully opaque (iOS rounds it).
 *   app/icon.png                             64px favicon, served by Next.
 *   resources/icon.png                       1024 source for capacitor-assets.
 *   resources/splash.png, splash-dark.png    2732 splash: the face at 20% of
 *     the width, centred on #4B4BF0 (light) and #16163F (dark).
 *
 * Re-run if the master changes. resources/ is sliced into ios/ and android/
 * by `npm run cap:assets`, which are generated and untracked, so that is a
 * step to repeat on a new machine.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MASTER = path.join(
  ROOT,
  'docs/superpowers/specs/assets/2026-11-05-kanko/kanko-app-icon.webp'
);
const INDIGO = '#4B4BF0';
const INK = '#16163F';

const out = (...p) => path.join(ROOT, ...p);
const master = () => sharp(MASTER);

/** The master resized to a square, flattened (no alpha). */
const square = (size) =>
  master().resize(size, size).flatten({ background: INDIGO }).png();

/** The face scaled to `fraction` of `size`, centred on a flat colour. */
const onGround = async (size, fraction, background) => {
  const face = await master()
    .resize(Math.round(size * fraction))
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 3, background }
  })
    .composite([{ input: face, gravity: 'centre' }])
    .png();
};

const targets = [
  ['public/icons/icon-192.png', () => square(192)],
  ['public/icons/icon-512.png', () => square(512)],
  ['public/icons/icon-maskable-512.png', () => onGround(512, 0.8, INDIGO)],
  ['public/icons/apple-touch-icon.png', () => square(180)],
  ['app/icon.png', () => square(64)],
  ['resources/icon.png', () => square(1024)],
  ['resources/splash.png', () => onGround(2732, 0.2, INDIGO)],
  ['resources/splash-dark.png', () => onGround(2732, 0.2, INK)]
];

for (const [file, build] of targets) {
  await mkdir(path.dirname(out(file)), { recursive: true });
  await (await build()).toFile(out(file));
  console.log(`wrote ${file}`);
}

console.log('\nNext: npm run cap:assets   (slices resources/ into ios/ and android/)');
