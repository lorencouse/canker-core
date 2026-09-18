/**
 * The five stages of a minor aphthous ulcer, and the drawing of each.
 *
 * This is one module rather than a React component plus a separate image,
 * because the diagrams are served two ways — inline on the article and as a
 * standalone SVG at /diagrams/canker-sore-stages.svg that other sites can
 * embed — and two renderers of the same picture would drift apart within a
 * month. `stageMarkup` is the single source of the drawing; both callers
 * position it and wrap it in their own <svg>.
 *
 * Colour follows the product's rule that red is data. The inflamed halo is
 * drawn from the --sev-* ramp because its intensity *is* the pain level, so
 * the stage where the ring is darkest is the stage that hurts most. Everything
 * else — mucosa, the fibrin floor — is neutral, which is also why the
 * diagrams do not look like the photographs they are competing with.
 *
 * Hex rather than CSS variables: the standalone SVG is served without our
 * stylesheet, so it has to carry its own colour.
 */

/** The light-theme --sev-* ramp, resolved. Index = pain level 1–10. */
const SEVERITY = [
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

const MUCOSA = '#e6e2e2';
const MUCOSA_EDGE = '#d7d2d2';
const FIBRIN = '#faf7ef';
const FIBRIN_EDGE = '#e6ddc6';
const INK = '#131a21';
const INK_SOFT = '#6b7785';

/** Every diagram is drawn at one scale, so the sizes are comparable. */
export const PX_PER_MM = 7;

export type Stage = {
  key: string;
  name: string;
  days: string;
  /** Typical width across, in millimetres. Zero means no open ulcer. */
  widthMm: number;
  /** Diameter of the inflamed halo, in millimetres. */
  haloMm: number;
  /** Pain on the product's 1–10 scale; 0 for stages that do not hurt. */
  pain: number;
  /** What you can see. */
  look: string;
  /** What it feels like. */
  feel: string;
};

export const STAGES: Stage[] = [
  {
    key: 'prodrome',
    name: 'Prodrome',
    days: 'Day −2 to 0',
    widthMm: 0,
    haloMm: 5,
    pain: 2,
    look: 'Nothing, or a small pale bump. Often no mark at all yet.',
    feel: 'A tingle, a prickle, or a spot that feels tight when you move your lip.'
  },
  {
    key: 'ulceration',
    name: 'Ulceration',
    days: 'Day 1 to 3',
    widthMm: 4,
    haloMm: 11,
    pain: 8,
    look: 'The crater opens: a white or yellow floor inside a bright red ring, widening daily.',
    feel: 'The worst of it. Salt, citrus and toothpaste all find it.'
  },
  {
    key: 'peak',
    name: 'Peak',
    days: 'Day 4 to 6',
    widthMm: 7,
    haloMm: 14,
    pain: 5,
    look: 'At its widest, and holding still. The ring is still red but no longer spreading.',
    feel: 'Easing, which is the confusing part — it hurts less while it is at its biggest.'
  },
  {
    key: 'granulation',
    name: 'Granulation',
    days: 'Day 7 to 10',
    widthMm: 3,
    haloMm: 8,
    pain: 2,
    look: 'Filling in from the edges. The white centre shrinks first, the ring fades to pink.',
    feel: 'Noticeable against a tooth, not much else.'
  },
  {
    key: 'healed',
    name: 'Healed',
    days: 'Day 10 to 14',
    widthMm: 0,
    haloMm: 0,
    pain: 0,
    look: 'Closed. A faint pale patch for a few days, then nothing — minor sores do not scar.',
    feel: 'Gone.'
  }
];

/** The cell each stage is drawn into, in SVG user units. */
export const CELL = { width: 150, height: 124 };

const round = (n: number) => Math.round(n * 10) / 10;

/**
 * One stage, drawn centred on the origin. The caller supplies the <svg> and
 * the transform that puts it somewhere.
 */
export function stageMarkup(stage: Stage): string {
  const parts: string[] = [];

  // The mucosa panel. Rounded because a rectangle of tissue reads as a swatch
  // and an oval reads as a place in a mouth.
  parts.push(
    `<rect x="${-CELL.width / 2 + 8}" y="-46" width="${CELL.width - 16}" height="92" rx="34" fill="${MUCOSA}" stroke="${MUCOSA_EDGE}" stroke-width="1"/>`
  );

  const haloR = round((stage.haloMm * PX_PER_MM) / 2);
  const floorR = round((stage.widthMm * PX_PER_MM) / 2);

  if (stage.haloMm > 0) {
    const colour = SEVERITY[Math.max(1, stage.pain) - 1];
    // Two concentric circles instead of a gradient or a blur filter: an
    // embedded SVG has to survive being inlined, sanitised and re-served, and
    // filters are the first thing a sanitiser strips.
    parts.push(
      `<circle cx="0" cy="0" r="${haloR}" fill="${colour}" opacity="0.38"/>`,
      `<circle cx="0" cy="0" r="${round(haloR * 0.72)}" fill="${colour}" opacity="0.5"/>`
    );
  }

  if (floorR > 0) {
    parts.push(
      `<circle cx="0" cy="0" r="${floorR}" fill="${FIBRIN}" stroke="${FIBRIN_EDGE}" stroke-width="1"/>`
    );
  }

  if (stage.key === 'healed') {
    parts.push(`<circle cx="0" cy="0" r="9" fill="${FIBRIN}" opacity="0.7"/>`);
  }

  if (stage.key === 'prodrome') {
    // Nothing to draw but the feeling, so draw the feeling: a dashed ring
    // around a spot that has not become anything yet.
    parts.push(
      `<circle cx="0" cy="0" r="24" fill="none" stroke="${SEVERITY[1]}" stroke-width="1.5" stroke-dasharray="3 5"/>`
    );
  }

  return parts.join('');
}

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

/**
 * The whole set as one standalone SVG: what other sites embed, and what makes
 * this a linkable asset rather than just a page section.
 */
export function stripSvg(): string {
  const pad = 20;
  const width = pad * 2 + CELL.width * STAGES.length;
  const height = 238;
  const cells = STAGES.map((stage, i) => {
    const cx = pad + CELL.width * i + CELL.width / 2;
    const label = [
      `<text x="${cx}" y="34" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="${INK}">${stage.name}</text>`,
      `<text x="${cx}" y="52" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="${INK_SOFT}">${stage.days.replace(/−/g, '−')}</text>`,
      `<text x="${cx}" y="196" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="${INK_SOFT}">${stage.widthMm === 0 ? 'no open ulcer' : `about ${stage.widthMm}mm across`}</text>`
    ].join('');
    return `<g>${label}<g transform="translate(${cx}, 124)">${stageMarkup(stage)}</g></g>`;
  }).join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="The five stages of a canker sore, drawn to one scale: prodrome, ulceration, peak, granulation, healed.">`,
    `<title>The stages of a canker sore</title>`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    cells,
    scaleBarMarkup(pad + 4, 222),
    `<text x="${width - pad}" y="226" text-anchor="end" font-family="system-ui, sans-serif" font-size="11" fill="${INK_SOFT}">cankercore.com</text>`,
    `</svg>`
  ].join('');
}
