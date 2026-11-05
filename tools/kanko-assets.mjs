/**
 * Builds the in-app Kanko images from the masters in
 * docs/superpowers/specs/assets/2026-11-05-kanko/. The masters are 1024px;
 * the app never shows Kanko larger than ~320 CSS px, so 640px WebP covers 2x.
 *
 *   npm run art:kanko
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const masters = path.join(root, 'docs/superpowers/specs/assets/2026-11-05-kanko');
const out = path.join(root, 'public/images/kanko');

const SIZE = 640;
const QUALITY = 85;

const moods = {
  proud: 'kanko-proud-streak.webp',
  hello: 'kanko-hello.webp',
  curious: 'kanko-curious-empty.webp'
};
moods.gentle = 'kanko-gentle-bad-day.webp';

await mkdir(out, { recursive: true });

for (const [mood, file] of Object.entries(moods)) {
  await sharp(path.join(masters, file))
    .resize(SIZE, SIZE)
    .webp({ quality: QUALITY })
    .toFile(path.join(out, `kanko-${mood}.webp`));
}

// Neutral is the front view from the character sheet (1376x768): the
// top-left figure, cropped square with the ears and feet kept.
await sharp(path.join(masters, 'kanko-character-sheet.webp'))
  .extract({ left: 0, top: 28, width: 372, height: 372 })
  .resize(SIZE, SIZE)
  .webp({ quality: QUALITY })
  .toFile(path.join(out, 'kanko-neutral.webp'));

console.log(`Wrote 5 images to ${path.relative(root, out)}`);
