import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

import { contrastRatio, deltaE, deltaE2000, readTokens } from './contrast';

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

/*
 * The mouth map's tissue against the severity ramp. A sore is found by its
 * colour, so every pain level must stay perceptually distinct from every
 * fill it can sit on: CIEDE2000 of at least 12, and never less than the old
 * rose-grey tissue gave the same pair. WCAG luminance contrast is the wrong
 * yardstick here because it ignores hue. The old fills are frozen below;
 * the lips, which had no tokens of their own, were drawn in the old tissue
 * stops, so they answer to the weakest of those.
 */
const MM_FILLS = [
  'tissue',
  'tissue-deep',
  'tissue-light',
  'gum',
  'gum-deep',
  'tongue',
  'tongue-light',
  'tongue-deep',
  'palate',
  'throat',
  'tooth',
  'tooth-shade',
  'lip',
  'lip-light',
  'lip-deep'
];
/* The fills a map label is drawn on (roof, tongue, floor). */
const LABELLED = [
  'tissue',
  'tissue-light',
  'palate',
  'tongue',
  'tongue-light',
  'tongue-deep'
];
const SEV = Array.from({ length: 10 }, (_, i) => `sev-${i + 1}`);
const MIN_DELTA_E = 12;

const OLD_MM: Record<':root' | '.dark', Record<string, string>> = {
  ':root': {
    tissue: '355 21% 89%',
    'tissue-deep': '353 17% 81%',
    'tissue-light': '0 22% 94%',
    gum: '353 19% 83%',
    'gum-deep': '352 15% 75%',
    tongue: '355 21% 86%',
    'tongue-light': '0 27% 91%',
    'tongue-deep': '354 16% 78%',
    palate: '0 23% 91%',
    throat: '354 17% 79%',
    tooth: '43 33% 96%',
    'tooth-shade': '41 24% 87%'
  },
  '.dark': {
    tissue: '338 8% 27%',
    'tissue-deep': '340 8% 21%',
    'tissue-light': '342 8% 33%',
    gum: '346 9% 28%',
    'gum-deep': '342 9% 22%',
    tongue: '342 8% 30%',
    'tongue-light': '344 8% 35%',
    'tongue-deep': '333 9% 23%',
    palate: '340 7% 31%',
    throat: '340 7% 21%',
    tooth: '36 13% 78%',
    'tooth-shade': '34 8% 64%'
  }
};

/** What the old palette gave this sev colour on the same fill. */
const oldDeltaE = (scope: ':root' | '.dark', sev: string, fill: string) => {
  const old = OLD_MM[scope];
  const stops = fill.startsWith('lip')
    ? [old['tissue-light'], old.tissue, old['tissue-deep']]
    : [old[fill]];
  return Math.min(...stops.map((stop) => deltaE(sev, stop)));
};

describe.each([':root', '.dark'] as const)('mouth map in %s', (scope) => {
  const tokens = readTokens(css, scope);

  it.each(SEV)('keeps %s distinct from every tissue fill', (sev) => {
    for (const fill of MM_FILLS) {
      expect(tokens[`mm-${fill}`], `--mm-${fill}`).toBeDefined();
      const now = deltaE(tokens[sev], tokens[`mm-${fill}`]);
      const floor = Math.max(MIN_DELTA_E, oldDeltaE(scope, tokens[sev], fill));
      expect(now, `${sev} on --mm-${fill}`).toBeGreaterThanOrEqual(floor);
    }
  });

  it('keeps map labels at 4.5:1 on the fills they sit on and on the card', () => {
    for (const fill of LABELLED) {
      expect(
        contrastRatio(tokens['mm-label'], tokens[`mm-${fill}`]),
        `--mm-label on --mm-${fill}`
      ).toBeGreaterThanOrEqual(4.5);
    }
    expect(
      contrastRatio(tokens['mm-label'], tokens['card'])
    ).toBeGreaterThanOrEqual(4.5);
  });
});

describe('deltaE2000', () => {
  // Sharma, Wu and Dalal (2005), test data pairs 1, 7 and 17.
  it.each([
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, 0, 0], [50, -1, 2], 2.3669],
    [[50, 2.5, 0], [73, 25, -18], 27.1492]
  ] as const)('matches the published value for %j vs %j', (a, b, want) => {
    expect(
      deltaE2000(
        [...a] as [number, number, number],
        [...b] as [number, number, number]
      )
    ).toBeCloseTo(want, 4);
  });

  it('is zero for one colour and symmetric', () => {
    expect(deltaE('240 85% 62%', '240 85% 62%')).toBeCloseTo(0, 6);
    expect(deltaE('0 62% 88%', '268 44% 91%')).toBeCloseTo(
      deltaE('268 44% 91%', '0 62% 88%'),
      6
    );
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white and symmetric', () => {
    expect(contrastRatio('0 0% 0%', '0 0% 100%')).toBeCloseTo(21, 1);
    expect(contrastRatio('0 0% 100%', '0 0% 0%')).toBeCloseTo(21, 1);
  });
});
