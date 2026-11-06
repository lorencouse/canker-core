/**
 * Generates the PNG app icons and splash screens from Kanko's art.
 *
 * Source: docs/superpowers/specs/assets/2026-11-05-kanko/kanko-app-icon.webp,
 * 1024x1024, the bust on solid indigo (#4B4BF0) edge to edge, with his body cut
 * flat above the bottom. Icons shift him down onto the bottom edge; the solid
 * ground needs no transparency work.
 *
 *   node scripts/generate-app-icons.mjs
 *
 * Output:
 *   public/icons/icon-192.png, icon-512.png  PWA manifest icons.
 *   public/icons/icon-maskable-512.png       Android maskable: the face is
 *     scaled into the 80% safe zone on solid indigo that bleeds to the edge,
 *     body still flush with the bottom.
 *   public/icons/apple-touch-icon.png        180px, fully opaque (iOS rounds it).
 *   app/icon.png                             64px favicon, served by Next.
 *   resources/icon.png                       1024 source for capacitor-assets.
 *   resources/splash.png, splash-dark.png    2732 splash: the full-body
 *     Kanko at 22% of the width, centred. Light is the transparent cut-out on
 *     #4B4BF0; dark is his native dark art, opaque on #0F1033, on that same
 *     ground, so no cut-out edge shows.
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
import { faceSquare } from '../tools/kanko-face-art.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDIGO = '#4B4BF0';
const NIGHT = '#0F1033';

const out = (...p) => path.join(ROOT, ...p);

/**
 * Kanko's body is cut flat at the bottom of the master. Every square icon is
 * built so that cut sits on the bottom edge (tools/kanko-face-art.mjs finds the
 * row). `heightFrac` is how much of the square he fills, ears to cut.
 */
const FACE_FILL = 0.82;
// Maskable icons keep the face inside the central 80% circle, so he is
// smaller, but still stands on the bottom edge.
const MASKABLE_FILL = 0.66;

const square = async (size) => (await faceSquare(size, FACE_FILL)).png();

/**
 * The opaque source's ground is lossy WebP: a level or two off `background`,
 * with compression blocks, so pasted as is its rectangle shows. Fade each
 * pixel's alpha with its distance from the ground (smoothstep, 3 to 12
 * levels) so the near-ground noise vanishes while the shadow still fades
 * continuously, and feather the outer margin to 0 so no edge can survive.
 */
const keyToGround = async (file, background) => {
  const { data, info } = await sharp(file)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const g = [1, 3, 5].map((i) => parseInt(background.slice(i, i + 2), 16));
  const smooth = (x, lo, hi) => {
    const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo)));
    return t * t * (3 - 2 * t);
  };
  const margin = Math.round(Math.min(W, H) * 0.08);
  const rgba = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      let d = 0;
      for (let c = 0; c < 3; c++) {
        const v = data[p * 3 + c];
        rgba[p * 4 + c] = v;
        d = Math.max(d, Math.abs(v - g[c]));
      }
      const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
      rgba[p * 4 + 3] = Math.round(
        255 * smooth(d, 3, 12) * smooth(edge, 0, margin)
      );
    }
  }
  return rgba;
};

/**
 * Full-body Kanko centred on a flat colour, `fraction` of the width. Small
 * enough that capacitor-assets' arbitrary crops never reach him. `background`
 * must be the source's own ground when the source is opaque.
 *
 * The figure is sized and centred by its trimmed box. An opaque source is
 * pasted whole, untrimmed: cropping it to that box would cut his soft contact shadow off
 * at a straight edge before it has faded into the ground.
 */
const splash = async (size, fraction, source, background) => {
  const file = out('public/images/kanko', source);
  const target = Math.round(size * fraction);
  const ground = sharp({
    create: { width: size, height: size, channels: 3, background }
  });
  const { hasAlpha, width, height } = await sharp(file).metadata();
  if (hasAlpha) {
    const body = await sharp(file)
      .trim({ threshold: 10 })
      .resize({ width: target, height: target, fit: 'inside' })
      .png()
      .toBuffer();
    return ground.composite([{ input: body, gravity: 'centre' }]).png();
  }
  const { info: box } = await sharp(file)
    .trim({ threshold: 10 })
    .toBuffer({ resolveWithObject: true });
  const scale = Math.min(target / box.width, target / box.height);
  const body = await sharp(await keyToGround(file, background), {
    raw: { width, height, channels: 4 }
  })
    .resize(Math.round(width * scale), Math.round(height * scale))
    .png()
    .toBuffer();
  // Centre the figure's box, not the whole pasted image.
  const cx = (-box.trimOffsetLeft + box.width / 2) * scale;
  const cy = (-box.trimOffsetTop + box.height / 2) * scale;
  return ground
    .composite([
      {
        input: body,
        left: Math.round(size / 2 - cx),
        top: Math.round(size / 2 - cy)
      }
    ])
    .png();
};

const targets = [
  ['public/icons/icon-192.png', () => square(192)],
  ['public/icons/icon-512.png', () => square(512)],
  [
    'public/icons/icon-maskable-512.png',
    async () => (await faceSquare(512, MASKABLE_FILL)).png()
  ],
  ['public/icons/apple-touch-icon.png', () => square(180)],
  ['app/icon.png', () => square(64)],
  ['resources/icon.png', () => square(1024)],
  [
    'resources/splash.png',
    () => splash(2732, 0.22, 'kanko-neutral.webp', INDIGO)
  ],
  [
    'resources/splash-dark.png',
    () => splash(2732, 0.22, 'kanko-neutral-dark.webp', NIGHT)
  ]
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
