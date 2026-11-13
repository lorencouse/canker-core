/**
 * The numbers behind the app's two swipes, kept apart from the DOM so they
 * can be tested: the edge swipe that goes back a screen and the swipe on a
 * sore row that marks it healed or opens its log.
 */

/** How far in from the left edge a back swipe may start, in CSS px. */
export const EDGE_START_PX = 24;
/** How far it must travel to count, and how much more across than down. */
export const EDGE_COMMIT_PX = 72;

/**
 * Where the edge swipe is ours to draw. Only inside the iOS app: its web
 * view has no back gesture of its own, so nothing is fought. Safari and
 * Chrome on a phone already go back from the edge, and Android's system
 * back gesture owns both edges, so the app adds nothing there.
 */
export function edgeSwipeAllowed(native: boolean, platform: string): boolean {
  return native && platform === 'ios';
}

/** True when a touch that began at `start` and is now at `at` is a back swipe. */
export function isEdgeSwipeBack(
  start: { x: number; y: number },
  at: { x: number; y: number }
): boolean {
  if (start.x > EDGE_START_PX) return false;
  const dx = at.x - start.x;
  const dy = Math.abs(at.y - start.y);
  return dx >= EDGE_COMMIT_PX && dx > dy * 2;
}

/**
 * A sore row's swipe. Past the threshold the action is armed (and the
 * phone ticks once); let go there and it runs. The threshold is a share of
 * the row, capped, so a wide row on a tablet does not need a long drag.
 */
export type RowSwipe = 'healed' | 'log' | null;

export const ROW_SWIPE_MIN_PX = 88;
export const ROW_SWIPE_MAX_PX = 120;

export function rowSwipeThreshold(width: number): number {
  return Math.min(ROW_SWIPE_MAX_PX, Math.max(ROW_SWIPE_MIN_PX, width * 0.3));
}

/** Left is Healed, right is Log, as the board's native kit sets them. */
export function rowSwipeAction(dx: number, width: number): RowSwipe {
  const at = rowSwipeThreshold(width);
  if (dx <= -at) return 'healed';
  if (dx >= at) return 'log';
  return null;
}

/**
 * How far the row follows the finger: one to one up to the threshold, then
 * a quarter as much, so it feels like it reached a stop rather than a wall.
 */
export function rowSwipeOffset(dx: number, width: number): number {
  const at = rowSwipeThreshold(width);
  const over = Math.abs(dx) - at;
  if (over <= 0) return dx;
  return Math.sign(dx) * (at + over / 4);
}
