import { CHEEKS, FRONT, LIPS, type MouthView } from './geometry';

/**
 * The mouth map reduced to a glyph.
 *
 * A sigil is the map at 26px with one severity dot on it, used wherever a
 * sore is named away from the map itself. This module is only the outline
 * arithmetic; the drawing is components/sore/SoreSigil.tsx.
 *
 * The shapes are computed from the same FRONT/CHEEKS/LIPS constants the real
 * artwork uses, so a sigil cannot drift from the map it stands for.
 */

/** Rounded rectangles and ellipses are all a silhouette needs. */
export type SigilShape =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r: number };

/**
 * The map's hit-testing is generous at the edges — it accepts a tap up to 10
 * units outside an outline, so a sore can sit right on a lip margin. The
 * silhouette carries the same tolerance, so a legitimately placed sore is
 * never drawn off its own glyph.
 */
const PAD = 12;

/**
 * A view's outline, in the map's own drawing units.
 *
 * The front view is the whole cavity as one oval — the union of the two
 * dental arches, which is what the outline of an open mouth is. Whatever the
 * artwork draws inside it, every plottable point of that view falls within
 * this oval, and sigil.test.ts holds that promise to the zone anchors.
 */
export function sigilShapes(view: MouthView): SigilShape[] {
  switch (view) {
    case 'front': {
      const top = FRONT.uy - FRONT.ury;
      const bottom = FRONT.ly + FRONT.lry;
      return [
        {
          kind: 'ellipse',
          cx: FRONT.cx,
          cy: (top + bottom) / 2,
          rx: FRONT.rx + PAD,
          ry: (bottom - top) / 2 + PAD
        }
      ];
    }
    case 'cheeks':
      return [CHEEKS.left, CHEEKS.right].map((pad) => ({
        kind: 'rect' as const,
        x: pad.x - PAD,
        y: pad.y - PAD,
        w: pad.w + PAD * 2,
        h: pad.h + PAD * 2,
        r: pad.w * 0.45
      }));
    case 'lips':
      return [LIPS.upper, LIPS.lower].map((lip) => ({
        kind: 'ellipse' as const,
        cx: lip.cx,
        cy: lip.y + lip.h * 0.5,
        rx: lip.w / 2 + PAD,
        ry: lip.h * 0.62 + PAD
      }));
  }
}

/** Whether a point in drawing units lands on the glyph. */
export const sigilCovers = (view: MouthView, p: { x: number; y: number }) =>
  sigilShapes(view).some((shape) => inShape(shape, p));

const inShape = (shape: SigilShape, p: { x: number; y: number }): boolean => {
  if (shape.kind === 'ellipse') {
    return ((p.x - shape.cx) / shape.rx) ** 2 + ((p.y - shape.cy) / shape.ry) ** 2 <= 1;
  }
  const { x, y, w, h, r } = shape;
  if (p.x < x || p.x > x + w || p.y < y || p.y > y + h) return false;
  const dx = Math.max(0, Math.max(x + r - p.x, p.x - (x + w - r)));
  const dy = Math.max(0, Math.max(y + r - p.y, p.y - (y + h - r)));
  return dx * dx + dy * dy <= r * r;
};
