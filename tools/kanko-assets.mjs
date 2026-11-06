/**
 * Builds the in-app Kanko images from the masters in
 * docs/superpowers/specs/assets/2026-11-05-kanko/. The masters are 1024px;
 * the app never shows Kanko larger than ~320 CSS px, so 640px WebP covers 2x.
 *
 *   npm run art:kanko
 */
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { faceSquare } from './kanko-face-art.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const masters = path.join(
  root,
  'docs/superpowers/specs/assets/2026-11-05-kanko'
);
const out = path.join(root, 'public/images/kanko');

const SIZE = 640;
const QUALITY = 85;
// Dark art is large flat ground, where lossy WebP drifts a few levels at q85.
const DARK_QUALITY = 92;

const moods = {
  proud: 'kanko-proud-streak.webp',
  hello: 'kanko-hello.webp',
  curious: 'kanko-curious-empty.webp',
  gentle: 'kanko-gentle-bad-day.webp'
};

// The art is painted on a flat lavender ground. The background is the region
// of near-ground pixels connected to the image border (so pale fur inside the
// figure is never made see-through). Inside it, a pixel keeps alpha by its
// distance from the ground, and ground that is slightly darker is the contact
// shadow: it becomes a soft translucent ink rather than a lavender smudge.
const NEAR_GROUND = 14; // distance under which a border-connected pixel is background
const EDGE_RING = 2; // px beside the background whose ground share is unmixed
const EDGE_FULL = 46; // distance at which an edge pixel is fully art
const FULLY_GROUND = 6; // at or under this distance: transparent
const SHADOW_INK = [10, 10, 40];
const SHADOW_STRENGTH = 0.3; // most opaque a shadow pixel may be
const SHADOW_MAX_DEFICIT = 70; // darker than this is a pupil, not shadow
const SHADOW_MAX_CHROMA = 28;
const SHADOW_FULL_DEFICIT = 50; // luma deficit that reaches SHADOW_STRENGTH * 1

const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

const toTransparent = async (pipeline) => {
  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const patch = 12;
  const ground = [0, 0, 0];
  let n = 0;
  for (const cx of [0, width - patch]) {
    for (const cy of [0, height - patch]) {
      for (let y = cy; y < cy + patch; y++) {
        for (let x = cx; x < cx + patch; x++) {
          const i = (y * width + x) * 4;
          for (let c = 0; c < 3; c++) ground[c] += data[i + c];
          n++;
        }
      }
    }
  }
  for (let c = 0; c < 3; c++) ground[c] /= n;
  const groundLuma = luma(...ground);

  const dist = (p) =>
    Math.hypot(
      data[p * 4] - ground[0],
      data[p * 4 + 1] - ground[1],
      data[p * 4 + 2] - ground[2]
    );

  // Flood fill from every border pixel through near-ground pixels.
  const isBg = new Uint8Array(width * height);
  const stack = [];
  // Ground, or the grey-lavender of the contact shadow (darker, low chroma).
  const isGroundLike = (p) => {
    if (dist(p) < NEAR_GROUND) return true;
    const [r, g, b] = [data[p * 4], data[p * 4 + 1], data[p * 4 + 2]];
    const deficit = groundLuma - luma(r, g, b);
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    return (
      deficit > 0 && deficit < SHADOW_MAX_DEFICIT && chroma <= SHADOW_MAX_CHROMA
    );
  };
  const push = (p) => {
    if (!isBg[p] && isGroundLike(p)) {
      isBg[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  while (stack.length) {
    const p = stack.pop();
    const x = p % width;
    if (x > 0) push(p - 1);
    if (x < width - 1) push(p + 1);
    if (p >= width) push(p - width);
    if (p < width * (height - 1)) push(p + width);
  }

  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    if (!isBg[p]) continue; // figure, confetti core: stays opaque
    const d = dist(p);
    const deficit = groundLuma - luma(data[i], data[i + 1], data[i + 2]);
    if (d <= FULLY_GROUND || deficit <= 0) {
      data[i + 3] = 0;
      continue;
    }
    const a = Math.min(1, deficit / SHADOW_FULL_DEFICIT) * SHADOW_STRENGTH;
    data[i] = SHADOW_INK[0];
    data[i + 1] = SHADOW_INK[1];
    data[i + 2] = SHADOW_INK[2];
    data[i + 3] = Math.round(a * 255);
  }

  // Anti-aliased edge: art pixels within EDGE_RING of the background still
  // carry some ground colour. Give them partial alpha and take the ground's
  // share back out of the colour, so no light fringe shows on a dark page.
  const ring = new Uint8Array(width * height);
  for (let p = 0; p < width * height; p++) {
    if (isBg[p]) continue;
    const x = p % width;
    const y = (p - x) / width;
    search: for (let dy = -EDGE_RING; dy <= EDGE_RING; dy++) {
      for (let dx = -EDGE_RING; dx <= EDGE_RING; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (isBg[ny * width + nx]) {
          ring[p] = 1;
          break search;
        }
      }
    }
  }
  for (let p = 0; p < width * height; p++) {
    if (!ring[p]) continue;
    const i = p * 4;
    const t = Math.min(
      1,
      Math.max(0, (dist(p) - FULLY_GROUND) / (EDGE_FULL - FULLY_GROUND))
    );
    const a = t * t * (3 - 2 * t);
    for (let c = 0; c < 3; c++) {
      const v =
        a > 0.05 ? (data[i + c] - (1 - a) * ground[c]) / a : data[i + c];
      data[i + c] = Math.round(Math.min(255, Math.max(0, v)));
    }
    data[i + 3] = Math.round(a * 255);
  }
  return sharp(data, { raw: { width, height, channels: 4 } });
};

const write = async (pipeline, name) =>
  (await toTransparent(pipeline))
    .webp({ quality: QUALITY, alphaQuality: 100 })
    .toFile(path.join(out, name));

await mkdir(out, { recursive: true });

for (const [mood, file] of Object.entries(moods)) {
  await write(
    sharp(path.join(masters, file)).resize(SIZE, SIZE),
    `kanko-${mood}.webp`
  );
}

// Neutral is the front view from the character sheet (1376x768): the
// top-left figure, cropped square with the ears and feet kept.
await write(
  sharp(path.join(masters, 'kanko-character-sheet.webp'))
    .extract({ left: 0, top: 28, width: 372, height: 372 })
    .resize(SIZE, SIZE),
  'kanko-neutral.webp'
);

// Dark mode: the owner-approved masters are drawn natively on the dark ground
// (page colour, or card colour for curious, which sits inside cards), so there
// is no cut-out. Each is opaque; we only nudge the ground onto the exact CSS
// token. The correction is a per-row offset measured from the left/right
// border columns, which also flattens any slight vertical gradient. Values
// are the hex of `.dark --background` / `--card` in styles/main.css.
const PAGE_DARK = [0x0f, 0x10, 0x33];
const CARD_DARK = [0x19, 0x1a, 0x48];
const darkMoods = {
  proud: PAGE_DARK,
  hello: PAGE_DARK,
  gentle: PAGE_DARK,
  neutral: PAGE_DARK,
  curious: CARD_DARK
};
const BORDER_COLS = 8;
const SMOOTH = 24; // rows either side for the moving average

const groundCorrected = async (pipeline, target) => {
  const { data, info } = await pipeline
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  // Median of the border columns per row and channel: robust to a stray speck.
  const measured = [];
  for (let y = 0; y < height; y++) {
    const row = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      const v = [];
      for (let k = 0; k < BORDER_COLS; k++) {
        v.push(data[(y * width + k) * 3 + c]);
        v.push(data[(y * width + width - 1 - k) * 3 + c]);
      }
      v.sort((a, b) => a - b);
      row[c] = (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
    }
    measured.push(row);
  }
  for (let y = 0; y < height; y++) {
    const lo = Math.max(0, y - SMOOTH);
    const hi = Math.min(height - 1, y + SMOOTH);
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let r = lo; r <= hi; r++) sum += measured[r][c];
      const offset = target[c] - sum / (hi - lo + 1);
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3 + c;
        data[i] = Math.round(Math.min(255, Math.max(0, data[i] + offset)));
      }
    }
  }
  // Same again per column from the top/bottom border rows, which flattens
  // any horizontal drift and the brighter last rows some masters carry.
  for (let c = 0; c < 3; c++) {
    const colMeasured = [];
    for (let x = 0; x < width; x++) {
      const v = [];
      for (let k = 0; k < BORDER_COLS; k++) {
        v.push(data[(k * width + x) * 3 + c]);
        v.push(data[((height - 1 - k) * width + x) * 3 + c]);
      }
      v.sort((a, b) => a - b);
      colMeasured.push((v[v.length / 2 - 1] + v[v.length / 2]) / 2);
    }
    for (let x = 0; x < width; x++) {
      const lo = Math.max(0, x - SMOOTH);
      const hi = Math.min(width - 1, x + SMOOTH);
      let sum = 0;
      for (let r = lo; r <= hi; r++) sum += colMeasured[r];
      const offset = target[c] - sum / (hi - lo + 1);
      for (let y = 0; y < height; y++) {
        const i = (y * width + x) * 3 + c;
        data[i] = Math.round(Math.min(255, Math.max(0, data[i] + offset)));
      }
    }
  }
  return sharp(data, { raw: { width, height, channels: 3 } });
};

const darkDir = path.join(masters, 'dark');
for (const [mood, target] of Object.entries(darkMoods)) {
  let img = sharp(path.join(darkDir, `kanko-dark-${mood}.webp`));
  if (mood === 'neutral') {
    // Drawn about 12% larger than the others: shrink onto a padded canvas
    // (edge pixels copied outward, so the ground stays continuous).
    const inner = Math.round(1024 * 0.88);
    const pad = 1024 - inner;
    const shrunk = await img.resize(inner, inner).png().toBuffer();
    // Materialise the padded canvas as PNG: sharp runs resize before extend
    // inside one pipeline, so the final resize must be a separate step.
    const padded = await sharp(shrunk)
      .extend({
        top: Math.floor(pad / 2),
        bottom: Math.ceil(pad / 2),
        left: Math.floor(pad / 2),
        right: Math.ceil(pad / 2),
        extendWith: 'copy'
      })
      .png()
      .toBuffer();
    img = sharp(padded);
  }
  // Lossy WebP shifts flat dark colour by a few levels (YUV rounding), so
  // close the loop: encode, re-sample the corners, and bias the next pass by
  // the error until the written ground lands on the target.
  const file = path.join(out, `kanko-${mood}-dark.webp`);
  const base = await img.resize(SIZE, SIZE).removeAlpha().raw().toBuffer();
  const aim = [...target];
  let worst = Infinity;
  for (let pass = 0; pass < 6 && worst > 1; pass++) {
    const fixed = await groundCorrected(
      sharp(Buffer.from(base), {
        raw: { width: SIZE, height: SIZE, channels: 3 }
      }),
      aim
    );
    // Encode to memory and re-read from the buffer: libvips caches reads by
    // path, which would hand back the previous pass's pixels.
    const encoded = await fixed
      .webp({ quality: DARK_QUALITY, smartSubsample: true })
      .toBuffer();
    await writeFile(file, encoded);
    const { data, info } = await sharp(encoded)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const got = [0, 0, 0];
    worst = 0;
    const corners = [
      [0, 0],
      [info.width - 1, 0],
      [0, info.height - 1],
      [info.width - 1, info.height - 1]
    ];
    for (const [x, y] of corners) {
      for (let c = 0; c < 3; c++) {
        const v = data[(y * info.width + x) * 3 + c];
        got[c] += v / corners.length;
        worst = Math.max(worst, Math.abs(v - target[c]));
      }
    }
    for (let c = 0; c < 3; c++) aim[c] += target[c] - got[c];
  }
  if (worst > 2) {
    throw new Error(`${mood} dark ground is ${worst} levels off its target`);
  }
}

// The logo face: the app-icon bust with his flat body cut seated on the bottom
// edge (see kanko-face-art.mjs). Logo.tsx rounds the corners with CSS rather
// than clipping a circle, so the cut stays flush with the tile's bottom.
await (await faceSquare(256, 0.82))
  .webp({ quality: QUALITY })
  .toFile(path.join(out, 'kanko-face.webp'));

await copyFile(
  path.join(out, 'kanko-face.webp'),
  path.join(root, 'native/shell/kanko-face.webp')
);

console.log(
  `Wrote 6 images (plus 5 dark) to ${path.relative(root, out)}, plus the shell face`
);
