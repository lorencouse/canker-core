import {
  CRUST,
  CRUST_EDGE,
  FIBRIN,
  FIBRIN_EDGE,
  INK,
  INK_SOFT,
  LIP,
  LIP_EDGE,
  MUCOSA,
  MUCOSA_EDGE,
  PX_PER_MM,
  round,
  scaleBarMarkup,
  SEVERITY,
  SKIN
} from './palette';

/**
 * A canker sore and a cold sore, drawn side by side at one scale.
 *
 * The `pictures` and `photos` phrasings are a real part of this cluster, and
 * the honest way to serve them is a drawing: we cannot photograph strangers'
 * mouths, and a photo of someone else's sore has no scale, no day number and
 * no lip border to locate it against. What actually separates the two is a
 * *place* and a *sequence*, and both of those draw better than they
 * photograph.
 *
 * Structured like ./stages: one markup function used by the article component
 * and by the standalone SVG at /diagrams/canker-sore-vs-cold-sore.svg, so the
 * copy someone embeds on their own site cannot drift from the copy on ours.
 */

export type Lesion = {
  key: 'canker' | 'cold';
  name: string;
  /** Where it is, in the fewest words that are still true. */
  where: string;
  /** What the drawing is showing, for the alt text and the caption. */
  look: string;
  /** The sequence it runs through — the other half of the distinction. */
  course: string;
  contagious: string;
  /** Pain on the product's 1–10 scale, which is what the halo colour encodes. */
  pain: number;
  widthMm: number;
};

export const LESIONS: Lesion[] = [
  {
    key: 'canker',
    name: 'Canker sore',
    where:
      'Inside the mouth, on tissue that moves: inner lip, cheek, tongue, floor of the mouth.',
    look: 'One shallow round crater with a white or yellow floor inside a red ring. No blister, ever.',
    course:
      'Opens as an ulcer on day one, widest around day four, closed by day 7 to 14.',
    contagious: 'No. Not viral, not catchable, not passable to anyone.',
    pain: 8,
    widthMm: 5
  },
  {
    key: 'cold',
    name: 'Cold sore',
    where:
      'On the lip border or the skin just outside it, usually the same spot every time.',
    look: 'A cluster of small blisters that break together and crust over. Rarely one round crater.',
    course:
      'Tingle, then blisters within a day, then weeping, then a scab, gone in about 7 to 10 days.',
    contagious: 'Yes, and most while it is blistered or weeping.',
    pain: 5,
    widthMm: 8
  }
];

/** The cell each lesion is drawn into, in SVG user units. */
export const CELL = { width: 200, height: 150 };

/**
 * One lesion, drawn centred on the origin.
 *
 * The two halves are deliberately not the same picture with a different blob
 * in the middle. The canker sore is drawn against a panel of mucosa with no
 * edge in sight, because inside the mouth there is no landmark — and the cold
 * sore is drawn *across the lip border*, because that border is the entire
 * diagnostic point and leaving it out would throw away the drawing's only
 * genuine information.
 */
export function lesionMarkup(lesion: Lesion): string {
  const parts: string[] = [];
  const colour = SEVERITY[lesion.pain - 1];

  if (lesion.key === 'canker') {
    parts.push(
      `<rect x="${-CELL.width / 2 + 10}" y="-52" width="${CELL.width - 20}" height="104" rx="40" fill="${MUCOSA}" stroke="${MUCOSA_EDGE}" stroke-width="1"/>`
    );

    const haloR = round((lesion.widthMm * 2.2 * PX_PER_MM) / 2);
    const floorR = round((lesion.widthMm * PX_PER_MM) / 2);
    parts.push(
      `<circle cx="0" cy="0" r="${haloR}" fill="${colour}" opacity="0.38"/>`,
      `<circle cx="0" cy="0" r="${round(haloR * 0.72)}" fill="${colour}" opacity="0.5"/>`,
      `<circle cx="0" cy="0" r="${floorR}" fill="${FIBRIN}" stroke="${FIBRIN_EDGE}" stroke-width="1"/>`
    );

    return parts.join('');
  }

  // Skin above, lip below, and the vermilion border between them: the line the
  // whole comparison turns on, so it is drawn deep enough to read at thumbnail
  // size and stroked darker than either surface.
  const left = -CELL.width / 2 + 10;
  const right = CELL.width / 2 - 10;
  parts.push(
    `<rect x="${left}" y="-52" width="${right - left}" height="104" rx="12" fill="${SKIN}"/>`,
    `<path d="M ${left} 10 Q 0 -22 ${right} 10 L ${right} 52 L ${left} 52 Z" fill="${LIP}"/>`,
    `<path d="M ${left} 10 Q 0 -22 ${right} 10" fill="none" stroke="${LIP_EDGE}" stroke-width="2"/>`
  );

  // The cluster straddles that border, which is the second half of the point:
  // several blisters together, at different stages, two of them already
  // crusted — against the single crater on the other side.
  const blisters = [
    { x: -29, y: 1, r: 9.5, crusted: false },
    { x: -11, y: -11, r: 8, crusted: false },
    { x: 5, y: 2, r: 10.5, crusted: false },
    { x: 22, y: -9, r: 7.5, crusted: true },
    { x: 29, y: 6, r: 8.5, crusted: true }
  ];
  parts.push(
    `<ellipse cx="0" cy="-2" rx="54" ry="26" fill="${colour}" opacity="0.26"/>`
  );
  for (const blister of blisters) {
    if (blister.crusted) {
      parts.push(
        `<circle cx="${blister.x}" cy="${blister.y}" r="${blister.r}" fill="${CRUST}" stroke="${CRUST_EDGE}" stroke-width="1"/>`
      );
      continue;
    }
    // A dome rather than a disc: the fill plus one offset highlight is enough
    // to read as fluid under a surface, and survives being re-served by a
    // sanitiser that strips gradients.
    parts.push(
      `<circle cx="${blister.x}" cy="${blister.y}" r="${blister.r}" fill="${FIBRIN}" stroke="${colour}" stroke-width="1.2"/>`,
      `<circle cx="${round(blister.x - blister.r * 0.34)}" cy="${round(blister.y - blister.r * 0.34)}" r="${round(blister.r * 0.2)}" fill="#ffffff" opacity="0.7"/>`
    );
  }

  return parts.join('');
}

/**
 * The pair as one standalone SVG: what other sites embed, and the reason to
 * give the drawing away rather than keep it behind the article.
 */
export function comparisonSvg(): string {
  const pad = 22;
  const width = pad * 2 + CELL.width * LESIONS.length + 24;
  const height = 250;

  const cells = LESIONS.map((lesion, i) => {
    const cx = pad + (CELL.width + 24) * i + CELL.width / 2;
    const labels = [
      `<text x="${cx}" y="36" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="${INK}">${lesion.name}</text>`,
      `<text x="${cx}" y="56" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="${INK_SOFT}">${lesion.key === 'canker' ? 'inside the mouth' : 'on the lip border'}</text>`,
      `<text x="${cx}" y="212" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="${INK_SOFT}">${lesion.key === 'canker' ? 'one round crater, never blisters' : 'a cluster of blisters, then a crust'}</text>`
    ].join('');
    return `<g>${labels}<g transform="translate(${cx}, 136)">${lesionMarkup(lesion)}</g></g>`;
  }).join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="A canker sore and a cold sore drawn side by side: the canker sore is a single round crater on the lining inside the mouth, the cold sore is a cluster of blisters on the lip border.">`,
    `<title>Canker sore and cold sore, side by side</title>`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    cells,
    scaleBarMarkup(pad + 4, 234),
    `<text x="${width - pad}" y="238" text-anchor="end" font-family="system-ui, sans-serif" font-size="11" fill="${INK_SOFT}">cankercore.com</text>`,
    `</svg>`
  ].join('');
}
