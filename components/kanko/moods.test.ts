import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { KANKO } from './moods';

const publicDir = path.resolve(__dirname, '../../public');

describe('KANKO', () => {
  it('has every mood', () => {
    expect(Object.keys(KANKO).sort()).toEqual([
      'clipboard',
      'curious',
      'envelope',
      'gentle',
      'hello',
      'lost',
      'magnify',
      'medal',
      'neutral',
      'offline',
      'phone',
      'point',
      'proud',
      'reading'
    ]);
  });

  it.each(Object.entries(KANKO))('%s points at a real, light file', (_, k) => {
    const file = path.join(publicDir, k.src);
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeLessThan(120 * 1024);
  });

  // Hex of `.dark --background` / `--card` in styles/main.css.
  const PAGE = [0x0f, 0x10, 0x33];
  const CARD = [0x19, 0x1a, 0x48];

  it.each(Object.entries(KANKO))(
    '%s dark art is light and sits on its dark ground',
    async (mood, k) => {
      const file = path.join(publicDir, k.darkSrc);
      expect(existsSync(file)).toBe(true);
      expect(statSync(file).size).toBeLessThan(120 * 1024);

      // Curious sits inside cards; the rest sit on the page.
      const target = mood === 'curious' ? CARD : PAGE;
      const { data, info } = await sharp(readFileSync(file))
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      for (const [x, y] of [
        [0, 0],
        [info.width - 1, 0],
        [0, info.height - 1],
        [info.width - 1, info.height - 1]
      ]) {
        for (let c = 0; c < 3; c++) {
          const v = data[(y * info.width + x) * 3 + c];
          expect(Math.abs(v - target[c])).toBeLessThanOrEqual(3);
        }
      }

      // No patch of ground drifts: every 16px block of plain ground in the
      // top third (above the contact shadow) averages within 2 levels, so
      // the art shows no square on the page. Blocks touching the figure,
      // stars or props are skipped.
      const B = 16;
      for (let by = 0; by + B <= info.height / 3; by += B) {
        for (let bx = 0; bx + B <= info.width; bx += B) {
          const sum = [0, 0, 0];
          let ground = true;
          for (let y = by; y < by + B && ground; y++) {
            for (let x = bx; x < bx + B; x++) {
              const i = (y * info.width + x) * 3;
              const d = Math.hypot(
                data[i] - target[0],
                data[i + 1] - target[1],
                data[i + 2] - target[2]
              );
              if (d > 12) {
                ground = false;
                break;
              }
              for (let c = 0; c < 3; c++) sum[c] += data[i + c];
            }
          }
          if (!ground) continue;
          for (let c = 0; c < 3; c++) {
            expect(Math.abs(sum[c] / (B * B) - target[c])).toBeLessThan(2);
          }
        }
      }
    }
  );
});
