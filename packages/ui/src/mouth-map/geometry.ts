/**
 * Mouth-map coordinate system.
 *
 * The map is a flat, dental-chart-style SVG drawn in a fixed 400x400 viewBox:
 * the mouth is "unwrapped" and viewed from the front as if in a mirror, so the
 * patient's LEFT cheek / tongue side is on the LEFT of the drawing. Top-to-bottom:
 * inner upper lip, upper gum, hard palate (dome) with the soft palate as a thin
 * band under it, tongue dorsum in the centre flanked by thin lateral bands, then
 * tongue ventral, floor of mouth, lower gum and inner lower lip. Cheeks are tall
 * panels down each side.
 *
 * Every surface has a bounding box in viewBox units. A sore stores its position
 * as normalised (0..1) coordinates *within its surface's bbox*, so the drawing can
 * be redrawn later without invalidating stored sores:
 *   viewBox x = bbox.x + x01 * bbox.w   (and the inverse, clamped to 0..1)
 * The 'other' surface has no geometry and is never drawn.
 */
import { SORE_SURFACES, type SoreSurface } from '@canker/core';

export const VIEWBOX_SIZE = 400;

export type MappedSurface = Exclude<SoreSurface, 'other'>;

export interface SurfaceBBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SurfaceGeometry {
  /** Bounding box of the drawn shape, in viewBox units. */
  bbox: SurfaceBBox;
  /** Where the tiny text label sits (centre point), in viewBox units. */
  label: { x: number; y: number };
}

export const MAPPED_SURFACES: ReadonlyArray<MappedSurface> = SORE_SURFACES.filter(
  (s): s is MappedSurface => s !== 'other'
);

export function isMappedSurface(
  surface: SoreSurface | null | undefined
): surface is MappedSurface {
  return surface != null && surface !== 'other';
}

export const SURFACE_GEOMETRY: Record<MappedSurface, SurfaceGeometry> = {
  lip_upper_inner: { bbox: { x: 40, y: 18, w: 320, h: 40 }, label: { x: 200, y: 29 } },
  gum_upper: { bbox: { x: 60, y: 46, w: 280, h: 36 }, label: { x: 200, y: 55 } },
  palate_hard: { bbox: { x: 96, y: 74, w: 208, h: 78 }, label: { x: 200, y: 118 } },
  palate_soft: { bbox: { x: 104, y: 158, w: 192, h: 17 }, label: { x: 200, y: 166 } },
  cheek_left: { bbox: { x: 16, y: 92, w: 68, h: 216 }, label: { x: 50, y: 200 } },
  cheek_right: { bbox: { x: 316, y: 92, w: 68, h: 216 }, label: { x: 350, y: 200 } },
  tongue_dorsum: { bbox: { x: 124, y: 180, w: 152, h: 100 }, label: { x: 200, y: 236 } },
  tongue_left: { bbox: { x: 104, y: 190, w: 20, h: 90 }, label: { x: 112, y: 258 } },
  tongue_right: { bbox: { x: 276, y: 190, w: 20, h: 90 }, label: { x: 288, y: 258 } },
  tongue_ventral: { bbox: { x: 124, y: 288, w: 152, h: 16 }, label: { x: 200, y: 296 } },
  floor_of_mouth: { bbox: { x: 116, y: 310, w: 168, h: 16 }, label: { x: 200, y: 318 } },
  gum_lower: { bbox: { x: 60, y: 318, w: 280, h: 36 }, label: { x: 200, y: 345 } },
  lip_lower_inner: { bbox: { x: 40, y: 342, w: 320, h: 40 }, label: { x: 200, y: 371 } }
};

/** SVG path data for each surface, in viewBox units. Kept simple and smooth. */
export const SURFACE_PATHS: Record<MappedSurface, string> = {
  lip_upper_inner: 'M 40 44 C 110 10 290 10 360 44 L 360 58 C 290 32 110 32 40 58 Z',
  gum_upper: 'M 60 66 C 130 40 270 40 340 66 L 340 82 C 270 58 130 58 60 82 Z',
  palate_hard:
    'M 96 152 L 96 140 C 96 96 142 74 200 74 C 258 74 304 96 304 140 L 304 152 Z',
  palate_soft: 'M 104 158 L 296 158 L 296 166 C 260 178 140 178 104 166 Z',
  cheek_left:
    'M 30 92 L 70 92 Q 84 92 84 106 L 84 294 Q 84 308 70 308 L 30 308 Q 16 308 16 294 L 16 106 Q 16 92 30 92 Z',
  cheek_right:
    'M 330 92 L 370 92 Q 384 92 384 106 L 384 294 Q 384 308 370 308 L 330 308 Q 316 308 316 294 L 316 106 Q 316 92 330 92 Z',
  tongue_dorsum:
    'M 132 280 Q 124 280 124 272 L 124 236 C 124 200 160 180 200 180 C 240 180 276 200 276 236 L 276 272 Q 276 280 268 280 Z',
  tongue_left:
    'M 104 280 L 104 236 C 104 214 110 200 122 190 L 132 198 C 124 206 120 218 120 236 L 120 280 Z',
  tongue_right:
    'M 296 280 L 296 236 C 296 214 290 200 278 190 L 268 198 C 276 206 280 218 280 236 L 280 280 Z',
  tongue_ventral:
    'M 130 288 L 270 288 Q 276 288 276 294 L 276 298 Q 276 304 270 304 L 130 304 Q 124 304 124 298 L 124 294 Q 124 288 130 288 Z',
  floor_of_mouth:
    'M 122 310 L 278 310 Q 284 310 284 316 L 284 320 Q 284 326 278 326 L 122 326 Q 116 326 116 320 L 116 316 Q 116 310 122 310 Z',
  gum_lower: 'M 60 334 C 130 360 270 360 340 334 L 340 318 C 270 342 130 342 60 318 Z',
  lip_lower_inner:
    'M 40 356 C 110 390 290 390 360 356 L 360 342 C 290 368 110 368 40 342 Z'
};

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Normalised (0..1) coordinates within a surface -> viewBox position. */
export function surfaceToViewBox(
  surface: MappedSurface,
  x01: number,
  y01: number
): { x: number; y: number } {
  const { bbox } = SURFACE_GEOMETRY[surface];
  return { x: bbox.x + clamp01(x01) * bbox.w, y: bbox.y + clamp01(y01) * bbox.h };
}

/** viewBox position -> normalised (0..1) coordinates within a surface, clamped. */
export function viewBoxToSurface(
  surface: MappedSurface,
  vx: number,
  vy: number
): { x: number; y: number } {
  const { bbox } = SURFACE_GEOMETRY[surface];
  return { x: clamp01((vx - bbox.x) / bbox.w), y: clamp01((vy - bbox.y) / bbox.h) };
}
