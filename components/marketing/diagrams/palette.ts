/**
 * The colours and the scale every drawn diagram on the site shares.
 *
 * Pulled out of the stage diagrams when a second set of drawings needed them:
 * two sets of drawings published as embeddable assets have to agree about what
 * mucosa looks like, or a page that shows both reads as two illustrators.
 *
 * Colour follows the product's rule that red is data. `SEVERITY` is the
 * `--sev-*` ramp and is only ever used for the inflamed halo, whose intensity
 * *is* the pain level — so a diagram cannot go red without declaring how much
 * the thing it draws hurts. Tissue, fibrin and skin are neutral, which is also
 * why these diagrams do not look like the photographs they compete with.
 *
 * Hex rather than CSS variables: the standalone SVGs are served without our
 * stylesheet, so they have to carry their own colour.
 */

/** The light-theme --sev-* ramp, resolved. Index = pain level 1–10. */
export const SEVERITY = [
  '#f3cdcd', // 1
  '#efc1c1',
  '#eb9e9e',
  '#e88686',
  '#e56c6c',
  '#e05252',
  '#e03838',
  '#d42121',
  '#c61b1b',
  '#ad1414' // 10
] as const;

/** Lining of the mouth: cheek, inner lip, floor. Where canker sores happen. */
export const MUCOSA = '#e6e2e2';
export const MUCOSA_EDGE = '#d7d2d2';

/**
 * The lip and the skin outside it. Separated by *value* rather than hue — a
 * pink lip would be the one thing on the site breaking the rule that red is
 * data, and the drawing only needs the two surfaces to be told apart.
 */
export const LIP = '#cdbdb9';
export const LIP_EDGE = '#b3a19d';
export const SKIN = '#f1ece9';

/** A cold sore's scab, once the blisters have broken. */
export const CRUST = '#c0ab9c';
export const CRUST_EDGE = '#a4907f';

/** The fibrin floor of an ulcer, and the fluid in a fresh blister. */
export const FIBRIN = '#faf7ef';
export const FIBRIN_EDGE = '#e6ddc6';

export const INK = '#131a21';
export const INK_SOFT = '#6b7785';

/** Every diagram is drawn at one scale, so the sizes are comparable. */
export const PX_PER_MM = 7;

export const round = (n: number) => Math.round(n * 10) / 10;

/** The millimetre scale bar that makes the sizes mean something. */
export function scaleBarMarkup(x: number, y: number): string {
  const width = 5 * PX_PER_MM;
  return [
    `<line x1="${x}" y1="${y}" x2="${x + width}" y2="${y}" stroke="${INK_SOFT}" stroke-width="1"/>`,
    `<line x1="${x}" y1="${y - 3}" x2="${x}" y2="${y + 3}" stroke="${INK_SOFT}" stroke-width="1"/>`,
    `<line x1="${x + width}" y1="${y - 3}" x2="${x + width}" y2="${y + 3}" stroke="${INK_SOFT}" stroke-width="1"/>`,
    `<text x="${x + width + 8}" y="${y + 4}" font-family="system-ui, sans-serif" font-size="11" fill="${INK_SOFT}">5mm, actual scale</text>`
  ].join('');
}
