import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
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
});
