import { describe, expect, it } from 'vitest';

import {
  edgeSwipeAllowed,
  isEdgeSwipeBack,
  ROW_SWIPE_MAX_PX,
  ROW_SWIPE_MIN_PX,
  rowSwipeAction,
  rowSwipeOffset,
  rowSwipeThreshold
} from './gestures';

describe('edge swipe back', () => {
  it('is drawn only inside the iOS app', () => {
    expect(edgeSwipeAllowed(true, 'ios')).toBe(true);
    expect(edgeSwipeAllowed(true, 'android')).toBe(false);
    expect(edgeSwipeAllowed(false, 'web')).toBe(false);
  });

  it('counts a swipe that starts at the edge and goes across', () => {
    expect(isEdgeSwipeBack({ x: 6, y: 300 }, { x: 110, y: 320 })).toBe(true);
  });

  it('ignores one that starts inside the screen', () => {
    expect(isEdgeSwipeBack({ x: 60, y: 300 }, { x: 200, y: 300 })).toBe(false);
  });

  it('ignores a scroll that drifts right', () => {
    expect(isEdgeSwipeBack({ x: 6, y: 300 }, { x: 90, y: 420 })).toBe(false);
  });

  it('ignores a short one', () => {
    expect(isEdgeSwipeBack({ x: 6, y: 300 }, { x: 50, y: 300 })).toBe(false);
  });
});

describe('sore row swipe', () => {
  it('scales the threshold with the row, within limits', () => {
    expect(rowSwipeThreshold(200)).toBe(ROW_SWIPE_MIN_PX);
    expect(rowSwipeThreshold(300)).toBe(90);
    expect(rowSwipeThreshold(1000)).toBe(ROW_SWIPE_MAX_PX);
  });

  it('left past the threshold is healed, right is log', () => {
    expect(rowSwipeAction(-100, 350)).toBe('healed');
    expect(rowSwipeAction(110, 350)).toBe('log');
  });

  it('short of it is nothing', () => {
    expect(rowSwipeAction(-60, 350)).toBeNull();
    expect(rowSwipeAction(60, 350)).toBeNull();
  });

  it('follows the finger, then resists past the threshold', () => {
    expect(rowSwipeOffset(50, 350)).toBe(50);
    expect(rowSwipeOffset(-145, 350)).toBe(-(105 + 40 / 4));
  });
});
