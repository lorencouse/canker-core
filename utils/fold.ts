/**
 * The fold of a dual-screen or folding phone, as the page lays itself out
 * around it (styles/main.css, THE FOLD). Ported from Aireio's lib/fold.ts,
 * which Kouzr shares, so the three apps read a fold the same way.
 *
 * Where the fold comes from:
 *
 *   Chrome on Android     the Viewport Segments API (window.viewport.segments),
 *                         two rects with the hinge between them.
 *   Android app           nothing in the System WebView (Surface Duo,
 *                         WebView 149). The shell reads Jetpack
 *                         WindowManager's folding features through the Fold
 *                         plugin (native/plugins/fold).
 *   iPhone app, 27.1+     nothing in WebKit. The same plugin reads UIKit's
 *                         division regions, which iPhone Duo reports while it
 *                         is partly folded.
 *
 * Either answer lands in one place: <html data-fold> says which way the fold
 * runs ("columns": top to bottom, so the page splits side by side; "rows":
 * across, so it splits top and bottom), and --fold-start, --fold-size and
 * --fold-end say where, in CSS px from the window's left (columns) or top
 * (rows). Everywhere else nothing is set and nothing in the stylesheet
 * changes. components/shell/LayoutWatch.tsx does the listening; this file is
 * the part plain Node can test.
 */

export type Rect = { x: number; y: number; width: number; height: number };

export type Fold = { axis: 'columns' | 'rows'; start: number; size: number };

/** The least room a pane needs either side of a fold, in CSS px. */
export const MIN_PANE = 240;
/** How far a fold down the window may sit off its middle and still be one
 *  the page splits on. A Duo's hinge is dead centre; a window in split
 *  screen that only clips the hinge is not. */
export const CENTRE_SLACK = 8;

/**
 * The fold from a plugin's regions, in a window of the given size. One region
 * is a fold; one taller than it is wide runs top to bottom, so the page
 * splits into columns. A foldable's crease is a line 0 wide and still a fold.
 *
 * No fold, so the page lays out by width alone: more than one region (no
 * phone has that), a rect with no length, a fold that leaves less than
 * MIN_PANE either side of it, or a fold down the window that is off its
 * middle.
 */
export function foldFromRegions(
  regions: readonly Rect[] | null | undefined,
  viewport: { width: number; height: number }
): Fold | null {
  if (!regions || regions.length !== 1) return null;
  const r = regions[0]!;
  const finite = [r.x, r.y, r.width, r.height].every(Number.isFinite);
  if (
    !finite ||
    r.width < 0 ||
    r.height < 0 ||
    Math.max(r.width, r.height) <= 0
  ) {
    return null;
  }
  const fold: Fold =
    r.height > r.width
      ? { axis: 'columns', start: r.x, size: r.width }
      : { axis: 'rows', start: r.y, size: r.height };
  const length = fold.axis === 'columns' ? viewport.width : viewport.height;
  if (fold.start < MIN_PANE || length - fold.start - fold.size < MIN_PANE) {
    return null;
  }
  if (
    fold.axis === 'columns' &&
    Math.abs(fold.start + fold.size / 2 - length / 2) > CENTRE_SLACK
  ) {
    return null;
  }
  return fold;
}

/**
 * The fold between the two segments Chrome reports for a spanned window
 * (window.viewport.segments), as the one region foldFromRegions reads. Side
 * by side, it is the strip from the first segment's right edge to the
 * second's left; stacked, from the first's bottom to the second's top. One
 * segment, or anything other than two, is no fold.
 */
export function regionsFromSegments(
  segments: readonly Rect[] | null | undefined
): Rect[] {
  if (!segments || segments.length !== 2) return [];
  const [a, b] = [...segments].sort((p, q) => p.x - q.x || p.y - q.y) as [
    Rect,
    Rect
  ];
  if (b.x >= a.x + a.width) {
    return [
      {
        x: a.x + a.width,
        y: a.y,
        width: b.x - (a.x + a.width),
        height: a.height
      }
    ];
  }
  if (b.y >= a.y + a.height) {
    return [
      {
        x: a.x,
        y: a.y + a.height,
        width: a.width,
        height: b.y - (a.y + a.height)
      }
    ];
  }
  return [];
}

export const FOLD_VARS = ['--fold-start', '--fold-size', '--fold-end'] as const;

/** What goes on <html> for a fold: the attribute and the three lengths. */
export function foldAttributes(fold: Fold | null): {
  axis: Fold['axis'] | null;
  vars: Record<(typeof FOLD_VARS)[number], string> | null;
} {
  if (!fold) return { axis: null, vars: null };
  const px = (n: number) => `${Math.round(n * 10) / 10}px`;
  return {
    axis: fold.axis,
    vars: {
      '--fold-start': px(fold.start),
      '--fold-size': px(fold.size),
      '--fold-end': px(fold.start + fold.size)
    }
  };
}

type FoldRoot = {
  dataset: DOMStringMap;
  style: Pick<CSSStyleDeclaration, 'setProperty' | 'removeProperty'>;
};

/** Writes one answer onto the root element, or clears it. */
export function applyFold(fold: Fold | null, root: FoldRoot): void {
  const { axis, vars } = foldAttributes(fold);
  if (!axis || !vars) {
    delete root.dataset.fold;
    for (const name of FOLD_VARS) root.style.removeProperty(name);
    return;
  }
  root.dataset.fold = axis;
  for (const name of FOLD_VARS) root.style.setProperty(name, vars[name]);
}
