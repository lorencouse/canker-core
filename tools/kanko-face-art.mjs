/**
 * Square crops of Kanko's bust for the icon, logo and favicon generators.
 *
 * The master (kanko-app-icon.webp) is the bust on solid indigo, but his body
 * is cut with a hard horizontal edge about 14% above the bottom, leaving an
 * indigo strip under it. Cropped as-is, every icon shows a sliced, floating
 * bust. Here the cut row is found programmatically and every square output is
 * built so that row is its last row: Kanko sits on the bottom edge.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FACE_MASTER = path.join(
  root,
  'docs/superpowers/specs/assets/2026-11-05-kanko/kanko-app-icon.webp'
);
export const INDIGO = [0x4b, 0x4b, 0xf0];

const GROUND_TOLERANCE = 30; // RGB distance under which a pixel is ground
const BODY_SPAN = 0.6; // a body row spans at least this share of the widest row

/**
 * Where the figure lives in the master: `cut` is the last row of the body (the
 * last row whose non-ground pixels span most of the body width), `top` the ear
 * tips, and `left`/`right` the horizontal extent down to the cut.
 */
export const measureFace = async () => {
  const { data, info } = await sharp(FACE_MASTER)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const spans = [];
  for (let y = 0; y < height; y++) {
    let lo = width;
    let hi = -1;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const d = Math.hypot(
        data[i] - INDIGO[0],
        data[i + 1] - INDIGO[1],
        data[i + 2] - INDIGO[2]
      );
      if (d > GROUND_TOLERANCE) {
        lo = Math.min(lo, x);
        hi = Math.max(hi, x);
      }
    }
    spans.push(hi < lo ? null : [lo, hi]);
  }
  const widest = Math.max(...spans.map((s) => (s ? s[1] - s[0] + 1 : 0)));
  const body = (s) => s && s[1] - s[0] + 1 >= widest * BODY_SPAN;
  let cut = -1;
  for (let y = height - 1; y >= 0; y--) {
    if (body(spans[y])) {
      cut = y;
      break;
    }
  }
  const rows = spans.slice(0, cut + 1);
  const top = rows.findIndex((s) => s);
  if (cut < 0 || top < 0) throw new Error('kanko-face-art: no figure found');
  const left = Math.min(...rows.filter(Boolean).map((s) => s[0]));
  const right = Math.max(...rows.filter(Boolean).map((s) => s[1]));
  return { width, height, cut, top, left, right };
};

/**
 * A `size` square with Kanko's cut sitting exactly on the bottom edge,
 * centred horizontally. `heightFrac` is how much of the square the figure
 * (ear tips to cut) fills, so the rest above the ears is breathing room.
 * Ground beyond the master's edges is copied outward, so it stays continuous.
 */
export const faceSquare = async (size, heightFrac) => {
  const m = await measureFace();
  const figureH = m.cut - m.top + 1;
  const scale = (size * heightFrac) / figureH;
  const rows = m.cut + 1; // everything down to and including the cut
  const piece = await sharp(FACE_MASTER)
    .removeAlpha()
    .extract({ left: 0, top: 0, width: m.width, height: rows })
    .resize({
      width: Math.round(m.width * scale),
      height: Math.round(rows * scale),
      kernel: 'lanczos3'
    })
    .png()
    .toBuffer();
  const meta = await sharp(piece).metadata();
  const w = meta.width;
  const h = meta.height;
  const centre = ((m.left + m.right + 1) / 2) * (w / m.width);
  const L = Math.round(centre - size / 2); // window left, in piece coordinates
  const T = h - size; // window top: its last row is the cut row
  const pad = {
    top: Math.max(0, -T),
    left: Math.max(0, -L),
    right: Math.max(0, L + size - w),
    bottom: 0
  };
  const padded = await sharp(piece)
    .extend({ ...pad, extendWith: 'copy' })
    .png()
    .toBuffer();
  return sharp(padded).extract({
    left: L + pad.left,
    top: T + pad.top,
    width: size,
    height: size
  });
};
