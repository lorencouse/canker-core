import { describe, expect, it } from 'vitest';

import {
  applyFold,
  foldAttributes,
  foldFromRegions,
  regionsFromSegments
} from './fold';

// A Surface Duo spanned like a book: 1114 x 720, hinge 540-574.
const SPANNED = { width: 1114, height: 720 };
const HINGE = { x: 540, y: 0, width: 34, height: 720 };

describe('foldFromRegions', () => {
  it('reads a Duo hinge as a fold down the middle', () => {
    expect(foldFromRegions([HINGE], SPANNED)).toEqual({
      axis: 'columns',
      start: 540,
      size: 34
    });
  });

  it('reads a Duo turned so its screens stack as a fold across', () => {
    const fold = foldFromRegions([{ x: 0, y: 540, width: 720, height: 34 }], {
      width: 720,
      height: 1114
    });
    expect(fold).toEqual({ axis: 'rows', start: 540, size: 34 });
  });

  it('takes a foldable crease that is a line 0 wide', () => {
    expect(
      foldFromRegions([{ x: 420, y: 0, width: 0, height: 700 }], {
        width: 840,
        height: 700
      })
    ).toEqual({ axis: 'columns', start: 420, size: 0 });
  });

  it('is no fold on one screen, or with no regions', () => {
    expect(foldFromRegions([], SPANNED)).toBeNull();
    expect(foldFromRegions(null, SPANNED)).toBeNull();
    expect(foldFromRegions(undefined, SPANNED)).toBeNull();
  });

  it('is no fold with more than one region', () => {
    expect(foldFromRegions([HINGE, HINGE], SPANNED)).toBeNull();
  });

  it('is no fold that leaves a pane under the minimum', () => {
    expect(
      foldFromRegions([{ x: 200, y: 0, width: 34, height: 720 }], {
        width: 434,
        height: 720
      })
    ).toBeNull();
  });

  it('is no fold down the window that is off its middle', () => {
    // A window in split screen wider than one Duo screen, clipping the hinge.
    expect(
      foldFromRegions([{ x: 540, y: 0, width: 34, height: 720 }], {
        width: 900,
        height: 720
      })
    ).toBeNull();
  });

  it('is no fold for a rect with no length or no numbers', () => {
    expect(
      foldFromRegions([{ x: 540, y: 0, width: 0, height: 0 }], SPANNED)
    ).toBeNull();
    expect(
      foldFromRegions([{ x: NaN, y: 0, width: 34, height: 720 }], SPANNED)
    ).toBeNull();
  });
});

describe('regionsFromSegments', () => {
  it('turns two side-by-side segments into the strip between them', () => {
    expect(
      regionsFromSegments([
        { x: 574, y: 0, width: 540, height: 720 },
        { x: 0, y: 0, width: 540, height: 720 }
      ])
    ).toEqual([HINGE]);
  });

  it('turns two stacked segments into the strip between them', () => {
    expect(
      regionsFromSegments([
        { x: 0, y: 0, width: 720, height: 540 },
        { x: 0, y: 574, width: 720, height: 540 }
      ])
    ).toEqual([{ x: 0, y: 540, width: 720, height: 34 }]);
  });

  it('is nothing for one segment, none, or overlapping ones', () => {
    expect(
      regionsFromSegments([{ x: 0, y: 0, width: 540, height: 720 }])
    ).toEqual([]);
    expect(regionsFromSegments(null)).toEqual([]);
    expect(
      regionsFromSegments([
        { x: 0, y: 0, width: 600, height: 720 },
        { x: 500, y: 0, width: 600, height: 720 }
      ])
    ).toEqual([]);
  });
});

describe('applyFold', () => {
  const root = () => {
    const props = new Map<string, string>();
    return {
      dataset: {} as DOMStringMap,
      style: {
        setProperty: (k: string, v: string) => void props.set(k, v),
        removeProperty: (k: string) => {
          const v = props.get(k) ?? '';
          props.delete(k);
          return v;
        }
      },
      props
    };
  };

  it('writes the axis and the three lengths, then clears them', () => {
    const r = root();
    applyFold({ axis: 'columns', start: 540, size: 34 }, r);
    expect(r.dataset.fold).toBe('columns');
    expect(Object.fromEntries(r.props)).toEqual({
      '--fold-start': '540px',
      '--fold-size': '34px',
      '--fold-end': '574px'
    });
    applyFold(null, r);
    expect(r.dataset.fold).toBeUndefined();
    expect(r.props.size).toBe(0);
  });

  it('rounds lengths to a tenth of a pixel', () => {
    expect(
      foldAttributes({ axis: 'columns', start: 540.04, size: 33.96 }).vars
    ).toEqual({
      '--fold-start': '540px',
      '--fold-size': '34px',
      '--fold-end': '574px'
    });
  });
});
