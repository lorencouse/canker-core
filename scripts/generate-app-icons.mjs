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
 *   resources/notification/drawable-<density>/ic_stat_kanko.png
 *     Android notification small icon, 24dp at mdpi through xxxhdpi. Android
 *     draws only its alpha (tinted by LocalNotifications.iconColor), so it is
 *     a white silhouette of Kanko's head on transparent, eyes cut out so it
 *     reads as Kanko rather than a blob. Source is the transparent
 *     public/images/kanko/kanko-neutral.webp (from tools/kanko-assets.mjs),
 *     not the icon master, whose solid ground has no silhouette to take.
 *     scripts/patch-native.mjs copies these into android/.
 *
 * Re-run if the master changes. resources/ is sliced into ios/ and android/
 * by `npm run cap:assets`, which are generated and untracked, so that is a
 * step to repeat on a new machine.
 */
import { mkdir } from 'node:fs/promises';
import { NOTIFICATION_ICON_SIZES } from '../utils/native-patches.mts';
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

/**
 * Kanko's head as a white-on-transparent mask: the figure's alpha, cropped
 * from the ear tips to just under the cheeks, with the two eyes (the largest
 * dark blobs in the upper half) widened and punched out.
 */
const notificationSilhouette = async () => {
  const { data, info } = await sharp(
    out('public/images/kanko/kanko-neutral.webp')
  )
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const solid = (p) => data[p * 4 + 3] > 128;

  let [x0, x1, y0] = [W, -1, H];
  for (let p = 0; p < W * H; p++) {
    if (!solid(p)) continue;
    const x = p % W;
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, Math.floor(p / W));
  }

  // Eyes: near-black, opaque, upper half. Label connected blobs, keep two.
  const dark = new Uint8Array(W * H);
  for (let p = 0; p < (W * H) / 2; p++) {
    const i = p * 4;
    const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (data[i + 3] > 200 && l < 90) dark[p] = 1;
  }
  const label = new Int32Array(W * H);
  const blobs = [];
  for (let p = 0; p < W * H; p++) {
    if (!dark[p] || label[p]) continue;
    const id = blobs.length + 1;
    const pixels = [];
    const stack = [p];
    label[p] = id;
    while (stack.length) {
      const q = stack.pop();
      pixels.push(q);
      const x = q % W;
      for (const r of [
        q - W,
        q + W,
        x > 0 ? q - 1 : -1,
        x < W - 1 ? q + 1 : -1
      ]) {
        if (r >= 0 && r < W * H && dark[r] && !label[r]) {
          label[r] = id;
          stack.push(r);
        }
      }
    }
    blobs.push(pixels);
  }
  blobs.sort((a, b) => b.length - a.length);
  if (blobs.length < 2 || blobs[1].length < 200) {
    throw new Error("notification icon: could not find Kanko's eyes");
  }

  const alpha = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) alpha[p] = data[p * 4 + 3];
  // At 24px an eye is about one pixel; widen the cut so it survives.
  const R = 12;
  for (const eye of blobs.slice(0, 2)) {
    for (const q of eye) {
      const [x, y] = [q % W, Math.floor(q / W)];
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          if (dx * dx + dy * dy <= R * R) alpha[(y + dy) * W + x + dx] = 0;
        }
      }
    }
  }

  const rgba = Buffer.alloc(W * H * 4, 255);
  for (let p = 0; p < W * H; p++) rgba[p * 4 + 3] = alpha[p];
  const width = x1 - x0 + 1;
  return sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: x0, top: y0, width, height: Math.round(width * 0.73) })
    .png()
    .toBuffer();
};

const notificationIcon = async (head, size) => {
  // Material keeps small icons inside a 22dp live area of the 24dp square.
  const inner = Math.round((size * 22) / 24);
  const clear = { r: 0, g: 0, b: 0, alpha: 0 };
  const fitted = await sharp(head)
    .resize(inner, inner, { fit: 'contain', background: clear })
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: clear }
  })
    .composite([{ input: fitted, gravity: 'centre' }])
    .png();
};

const head = await notificationSilhouette();
for (const [density, size] of Object.entries(NOTIFICATION_ICON_SIZES)) {
  targets.push([
    `resources/notification/drawable-${density}/ic_stat_kanko.png`,
    () => notificationIcon(head, size)
  ]);
}

for (const [file, build] of targets) {
  await mkdir(path.dirname(out(file)), { recursive: true });
  await (await build()).toFile(out(file));
  console.log(`wrote ${file}`);
}

console.log(
  '\nNext: npm run cap:assets   (slices resources/ into ios/ and android/)'
);
