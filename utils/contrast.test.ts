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

/*
 * The mouth map's tissue against the severity ramp. A sore is found by its
 * colour, so no tissue may make any pain level harder to see than the old
 * rose-grey tissue did. The old fills are frozen here as the baseline: for
 * each pain level, its weakest contrast against any old fill, per theme.
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
  'tooth-shade'
];
const LIP_FILLS = ['lip', 'lip-light', 'lip-deep'];
const SEV = Array.from({ length: 10 }, (_, i) => `sev-${i + 1}`);

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

/* The approved sketch's lip pink (#E9C2D0), which sat too near pale pain. */
const SKETCH_LIP = '338 47% 84%';

const weakest = (sev: string, fills: string[]) =>
  Math.min(...fills.map((fill) => contrastRatio(sev, fill)));

describe.each([':root', '.dark'] as const)('mouth map in %s', (scope) => {
  const tokens = readTokens(css, scope);
  const fills = [...MM_FILLS, ...LIP_FILLS];

  it.each(SEV)('keeps %s at least as findable as on the old tissue', (sev) => {
    const baseline = weakest(tokens[sev], Object.values(OLD_MM[scope]));
    for (const fill of fills) {
      expect(tokens[`mm-${fill}`], `--mm-${fill}`).toBeDefined();
      expect(
        contrastRatio(tokens[sev], tokens[`mm-${fill}`]),
        `${sev} on --mm-${fill}`
      ).toBeGreaterThanOrEqual(baseline);
    }
  });

  it('keeps map labels at 4.5:1 on every fill they can sit on', () => {
    for (const fill of fills.filter((f) => !f.startsWith('tooth'))) {
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

describe('mouth map lips', () => {
  it('keep pale pain easier to see than the sketch pink did', () => {
    const tokens = readTokens(css, ':root');
    const sevs = SEV.map((sev) => tokens[sev]);
    const sketch = Math.min(...sevs.map((sev) => contrastRatio(sev, SKETCH_LIP)));
    const lips = Math.min(
      ...sevs.map((sev) => weakest(sev, LIP_FILLS.map((f) => tokens[`mm-${f}`])))
    );
    expect(lips).toBeGreaterThan(sketch);
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white and symmetric', () => {
    expect(contrastRatio('0 0% 0%', '0 0% 100%')).toBeCloseTo(21, 1);
    expect(contrastRatio('0 0% 100%', '0 0% 0%')).toBeCloseTo(21, 1);
  });
});
