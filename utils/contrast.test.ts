import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

import { contrastRatio, readTokens } from './contrast';

const css = readFileSync(join(process.cwd(), 'styles/main.css'), 'utf8');

const PAIRS: [string, string][] = [
  ['foreground', 'background'],
  ['foreground', 'card'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['primary-foreground', 'primary'],
  ['accent-foreground', 'accent']
];

describe.each([':root', '.dark'] as const)('colour tokens in %s', (scope) => {
  const tokens = readTokens(css, scope);

  it.each(PAIRS)('%s on %s clears 4.5:1', (fg, bg) => {
    expect(tokens[fg], `--${fg}`).toBeDefined();
    expect(tokens[bg], `--${bg}`).toBeDefined();
    expect(contrastRatio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps text on sunflower readable', () => {
    expect(
      contrastRatio(tokens['win-foreground'], tokens['win'])
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the streak card label at 4.5:1', () => {
    expect(
      contrastRatio(tokens['streak-foreground'], tokens['streak'])
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the sunflower streak figure at 3:1 on the card (large text)', () => {
    expect(
      contrastRatio(tokens['win'], tokens['streak'])
    ).toBeGreaterThanOrEqual(3);
  });

  it.each(['background', 'card'])(
    'keeps a control edge findable at 3:1 against --%s',
    (ground) => {
      expect(
        contrastRatio(tokens['control'], tokens[ground])
      ).toBeGreaterThanOrEqual(3);
    }
  );

  it('defines the Momentum tokens later work relies on', () => {
    for (const name of [
      'win',
      'win-edge',
      'primary-edge',
      'comfort',
      'streak'
    ]) {
      expect(tokens[name], `--${name}`).toBeDefined();
    }
  });
});

describe('palette anchors', () => {
  it('uses the Momentum indigo as the light action colour', () => {
    // #4B4BF0 rounds to 85% saturation.
    expect(readTokens(css, ':root')['primary']).toBe('240 85% 62%');
  });

  it('leaves the severity ramp alone', () => {
    expect(readTokens(css, ':root')['sev-7']).toBe('0 73% 55%');
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white and symmetric', () => {
    expect(contrastRatio('0 0% 0%', '0 0% 100%')).toBeCloseTo(21, 1);
    expect(contrastRatio('0 0% 100%', '0 0% 0%')).toBeCloseTo(21, 1);
  });
});
