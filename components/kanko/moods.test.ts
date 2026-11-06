import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { KANKO } from './moods';

const publicDir = path.resolve(__dirname, '../../public');

describe('KANKO', () => {
  it('has all five moods', () => {
    expect(Object.keys(KANKO).sort()).toEqual([
      'curious',
      'gentle',
      'hello',
      'neutral',
      'proud'
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
    }
  );
});
