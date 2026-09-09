/**
 * Mouth-map geometry.
 *
 * The map is three flat views of the mouth. A sore is stored as the view it
 * was plotted on plus x/y as percentages of that view's drawing box, so the
 * artwork can be redrawn at any size without touching stored data.
 *
 * The zone label is derived from where the point lands, never typed in, so
 * it stays truthful when a sore is dragged.
 */

export const MOUTH_VIEWS = ['front', 'cheeks', 'lips'] as const;
export type MouthView = (typeof MOUTH_VIEWS)[number];

export const VIEW_LABELS: Record<MouthView, string> = {
  front: 'Front',
  cheeks: 'Cheeks',
  lips: 'Lips'
};

/** Every view is drawn in the same box so the tabs never change height. */
export const VIEW_BOX = { width: 390, height: 400 } as const;
export const viewBoxAttr = `0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`;

/**
 * Drawing units per millimetre, per view. Each view is drawn at a different
 * magnification (a cheek panel is a smaller patch of tissue than the whole
 * interior), so a 4 mm sore has to scale with it to read as the same size.
 */
export const UNITS_PER_MM: Record<MouthView, number> = {
  front: 5.5,
  cheeks: 4,
  lips: 5.2
};

/** A sore never shrinks below this radius, so it stays tappable. */
export const MIN_RADIUS = 4;

/* ------------------------------------------------------------------------ */
/* Layout of each view, shared by the artwork and the hit-testing below.     */
/* ------------------------------------------------------------------------ */

export const FRONT = (() => {
  const x = 45, y = 14, w = 300, h = 376;
  const cx = x + w / 2;
  const uy = y + h * 0.36; // upper arch centre line
  const ly = y + h * 0.64; // lower arch centre line
  const rx = w * 0.4;
  const ury = h * 0.31;
  const lry = h * 0.3;
  const tongueW = w * 0.52;
  return {
    x, y, w, h, cx, uy, ly, rx, ury, lry,
    tongue: { x: cx - tongueW / 2, w: tongueW, top: uy + h * 0.02, bottom: ly + lry * 0.6 }
  };
})();

export const CHEEKS = {
  left: { x: 18, y: 30, w: 168, h: 300 },
  right: { x: 204, y: 30, w: 168, h: 300 }
} as const;

export const LIPS = {
  upper: { cx: 195, y: 64, w: 340, h: 100 },
  lower: { cx: 195, y: 254, w: 340, h: 100 }
} as const;

/* ------------------------------------------------------------------------ */
/* Coordinate helpers                                                        */
/* ------------------------------------------------------------------------ */

export type Point = { x: number; y: number };

export const toPercent = (p: Point): Point => ({
  x: (p.x / VIEW_BOX.width) * 100,
  y: (p.y / VIEW_BOX.height) * 100
});

export const fromPercent = (p: Point): Point => ({
  x: (p.x / 100) * VIEW_BOX.width,
  y: (p.y / 100) * VIEW_BOX.height
});

export const radiusFor = (sizeMm: number, view: MouthView) =>
  Math.max(MIN_RADIUS, (sizeMm / 2) * UNITS_PER_MM[view]);

const inEllipse = (p: Point, cx: number, cy: number, rx: number, ry: number) =>
  ((p.x - cx) / rx) ** 2 + ((p.y - cy) / ry) ** 2 <= 1;

/** A rounded rectangle, approximated as a rect with elliptical corners. */
const inRoundedRect = (
  p: Point,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  if (p.x < x || p.x > x + w || p.y < y || p.y > y + h) return false;
  const dx = Math.max(0, Math.max(x + r - p.x, p.x - (x + w - r)));
  const dy = Math.max(0, Math.max(y + r - p.y, p.y - (y + h - r)));
  return dx * dx + dy * dy <= r * r;
};

/* ------------------------------------------------------------------------ */
/* Zone hit-testing                                                          */
/* ------------------------------------------------------------------------ */

/**
 * The region a point in drawing units falls in, or null when it is off the
 * tissue (in which case nothing should be plotted there).
 */
export function zoneAt(view: MouthView, p: Point): string | null {
  switch (view) {
    case 'cheeks': {
      const { left, right } = CHEEKS;
      if (inRoundedRect(p, left.x, left.y, left.w, left.h, left.w * 0.45))
        return 'Left cheek';
      if (inRoundedRect(p, right.x, right.y, right.w, right.h, right.w * 0.45))
        return 'Right cheek';
      return null;
    }
    case 'lips': {
      const { upper, lower } = LIPS;
      if (inEllipse(p, upper.cx, upper.y + upper.h * 0.6, upper.w / 2, upper.h * 0.6))
        return 'Upper lip';
      if (inEllipse(p, lower.cx, lower.y + lower.h * 0.45, lower.w / 2, lower.h * 0.62))
        return 'Lower lip';
      return null;
    }
    case 'front': {
      const f = FRONT;
      // Outside the cavity outline entirely?
      const inUpperOuter = p.y <= f.uy && inEllipse(p, f.cx, f.uy, f.rx + 10, f.ury + 10);
      const inLowerOuter = p.y >= f.ly && inEllipse(p, f.cx, f.ly, f.rx + 10, f.lry + 10);
      const inMiddle = p.y > f.uy && p.y < f.ly && Math.abs(p.x - f.cx) <= f.rx + 10;
      if (!inUpperOuter && !inLowerOuter && !inMiddle) return null;

      // Tongue, tested as a tapered box.
      const t = f.tongue;
      if (p.y >= t.top && p.y <= t.bottom) {
        const span = t.bottom - t.top;
        const taper = Math.max(0, (p.y - (t.top + span * 0.55)) / (span * 0.45));
        const halfW = (t.w / 2) * (1 - 0.55 * taper * taper);
        if (Math.abs(p.x - f.cx) <= halfW) return 'Tongue';
      }

      if (p.y <= f.uy) {
        if (inEllipse(p, f.cx, f.uy, f.rx - 16, f.ury - 16)) return 'Roof of mouth';
        return 'Upper gums';
      }
      if (p.y >= f.ly) {
        if (inEllipse(p, f.cx, f.ly, f.rx - 16, f.lry - 16)) return 'Floor of mouth';
        return 'Lower gums';
      }
      // The band between the arches: gum ends at the sides, throat in the middle.
      if (Math.abs(p.x - f.cx) > f.rx - 16) return p.y < (f.uy + f.ly) / 2 ? 'Upper gums' : 'Lower gums';
      return 'Back of mouth';
    }
  }
}

/** Zone for a stored sore (percent coordinates). */
export const zoneFor = (view: MouthView, xPct: number, yPct: number) =>
  zoneAt(view, fromPercent({ x: xPct, y: yPct })) ?? 'Mouth';

export const isMouthView = (v: unknown): v is MouthView =>
  typeof v === 'string' && (MOUTH_VIEWS as readonly string[]).includes(v);
