/**
 * Generates the PNG app icons from the Canker Core mark.
 *
 * The mark itself lives in components/icons/Logo.tsx as SVG, but an
 * installed app needs rasters: a manifest icon, a maskable icon Android can
 * crop to whatever shape the launcher uses, and an apple-touch-icon. There
 * is no SVG rasteriser on the build box, so this draws the two ellipses and
 * the dot directly and encodes the PNG with node's own zlib.
 *
 *   node scripts/generate-app-icons.mjs
 *
 * Re-run it if the mark changes. Output goes to public/icons/.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'icons'
);

/* Literal colours: an icon is drawn outside the page, so the CSS custom
   properties the component uses are not available here. These are the dark
   palette's values, because an icon sits on an unknown wallpaper and the
   dark ground keeps the teal legible on both. */
const BG = [0x13, 0x1a, 0x21];
const RING = [0x58, 0xb6, 0xc0];
const DOT = [0xe1, 0x4b, 0x4b];

/** Supersampling factor. 4x is indistinguishable from proper AA at these sizes. */
const SS = 4;

/**
 * The mark, in a 32x32 coordinate space matching the SVG, evaluated as
 * coverage at a point. Returns the colour to paint, or null for background.
 */
function sample(x, y) {
  const ring = ellipseRing(x, y, 16, 16, 10.5, 13, 2);
  const inner = ellipseRing(x, y, 16, 16, 5.5, 7.5, 1.25);
  const dot = (x - 20.5) ** 2 + (y - 11.5) ** 2 <= 3 ** 2;

  if (dot) return DOT;
  if (ring) return RING;
  // The inner ellipse is the faint one; mixed down toward the background.
  if (inner) return mix(BG, RING, 0.35);
  return null;
}

function ellipseRing(x, y, cx, cy, rx, ry, stroke) {
  const outer =
    ((x - cx) / (rx + stroke / 2)) ** 2 + ((y - cy) / (ry + stroke / 2)) ** 2;
  const innerEdge =
    ((x - cx) / (rx - stroke / 2)) ** 2 + ((y - cy) / (ry - stroke / 2)) ** 2;
  return outer <= 1 && innerEdge >= 1;
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/**
 * @param size    output edge length in pixels
 * @param inset   fraction of the canvas left empty around the mark. Maskable
 *                icons are cropped to an unknown shape, and the spec's safe
 *                zone is the middle 80%, so they need a wide margin.
 */
function render(size, inset) {
  const px = Buffer.alloc(size * size * 3);
  const scale = 32 / (1 - inset * 2) / size; // canvas px -> mark units
  const offset = -(size * inset) * scale;

  for (let py = 0; py < size; py++) {
    for (let pxi = 0; pxi < size; pxi++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const mx = (pxi + (sx + 0.5) / SS) * scale + offset;
          const my = (py + (sy + 0.5) / SS) * scale + offset;
          const c = sample(mx, my) ?? BG;
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const n = SS * SS;
      const i = (py * size + pxi) * 3;
      px[i] = Math.round(r / n);
      px[i + 1] = Math.round(g / n);
      px[i + 2] = Math.round(b / n);
    }
  }
  return png(size, px);
}

/** Minimal RGB8 PNG encoder: filter byte 0 per scanline, one IDAT. */
function png(size, rgb) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    rgb.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

mkdirSync(OUT, { recursive: true });
const files = [
  ['icon-192.png', 192, 0.12],
  ['icon-512.png', 512, 0.12],
  // Maskable: mark shrunk into the safe zone, background bleeding to the edge.
  ['icon-maskable-512.png', 512, 0.22],
  // iOS applies its own rounding and never shows transparency.
  ['apple-touch-icon.png', 180, 0.14]
];
for (const [name, size, inset] of files) {
  writeFileSync(join(OUT, name), render(size, inset));
  console.log(`wrote public/icons/${name} (${size}x${size})`);
}
