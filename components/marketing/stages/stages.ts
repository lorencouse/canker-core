import {
  FIBRIN,
  FIBRIN_EDGE,
  INK,
  INK_SOFT,
  MUCOSA,
  MUCOSA_EDGE,
  PX_PER_MM,
  round,
  scaleBarMarkup,
  SEVERITY
} from '@/components/marketing/diagrams/palette';

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
 * The palette and the millimetre scale live in ../diagrams/palette, shared
 * with the canker-sore-versus-cold-sore drawing.
 */

export { PX_PER_MM };

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
