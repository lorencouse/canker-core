import {
  LONG_SORE_DAYS,
  PAIN_ANCHORS,
  PAIN_MAX,
  PAIN_MIN,
  SIZE_MAX_MM,
  SIZE_MIN_MM,
  SIZE_REFERENCES,
  painAnchor,
  painBucket,
  sizeReference
} from './pain';

describe('painAnchor', () => {
  it('returns the anchor label at each anchor point', () => {
    expect(painAnchor(0)).toBe('No pain');
    expect(painAnchor(2)).toBe('Noticeable if I look for it');
    expect(painAnchor(4)).toBe('Hurts when eating');
    expect(painAnchor(6)).toBe('Hurts when talking');
    expect(painAnchor(8)).toBe('Hard to eat or sleep');
    expect(painAnchor(10)).toBe('Worst imaginable');
  });

  it('keeps the label of the last anchor at or below the value', () => {
    expect(painAnchor(1)).toBe('No pain');
    expect(painAnchor(3)).toBe('Noticeable if I look for it');
    expect(painAnchor(5)).toBe('Hurts when eating');
    expect(painAnchor(7)).toBe('Hurts when talking');
    expect(painAnchor(9)).toBe('Hard to eat or sleep');
  });

  it('clamps to the end labels outside the 0..10 range', () => {
    expect(painAnchor(-1)).toBe('No pain');
    expect(painAnchor(11)).toBe('Worst imaginable');
  });
});

describe('painBucket', () => {
  it('maps every pain value to the five-step ramp', () => {
    const buckets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(painBucket);
    expect(buckets).toEqual([1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });

  it('never leaves the 1..5 range for out-of-range pain', () => {
    expect(painBucket(-5)).toBe(1);
    expect(painBucket(99)).toBe(5);
  });
});

describe('sizeReference', () => {
  it('returns the reference label at each boundary', () => {
    expect(sizeReference(1)).toBe('pinhead');
    expect(sizeReference(3)).toBe('grain of rice');
    expect(sizeReference(5)).toBe('pencil eraser');
    expect(sizeReference(8)).toBe('pea');
    expect(sizeReference(12)).toBe('fingernail');
    expect(sizeReference(20)).toBe('dime');
  });

  it('keeps the label of the last reference at or below the size', () => {
    expect(sizeReference(2)).toBe('pinhead');
    expect(sizeReference(4)).toBe('grain of rice');
    expect(sizeReference(7)).toBe('pencil eraser');
    expect(sizeReference(11)).toBe('pea');
    expect(sizeReference(19)).toBe('fingernail');
    expect(sizeReference(30)).toBe('dime');
  });

  it('falls back to the smallest reference below the minimum size', () => {
    expect(sizeReference(0)).toBe('pinhead');
    expect(sizeReference(-3)).toBe('pinhead');
  });
});

describe('constants', () => {
  it('holds the documented ranges', () => {
    expect(PAIN_MIN).toBe(0);
    expect(PAIN_MAX).toBe(10);
    expect(SIZE_MIN_MM).toBe(1);
    expect(SIZE_MAX_MM).toBe(30);
    expect(LONG_SORE_DAYS).toBe(14);
  });

  it('lists pain anchors in ascending order inside the pain range', () => {
    const points = PAIN_ANCHORS.map((a) => a.at);
    expect(points).toEqual([...points].sort((a, b) => a - b));
    expect(points[0]).toBe(PAIN_MIN);
    expect(points.at(-1)).toBe(PAIN_MAX);
    expect(PAIN_ANCHORS.every((a) => a.label.length > 0)).toBe(true);
  });

  it('lists size references in ascending order inside the size range', () => {
    const sizes = SIZE_REFERENCES.map((r) => r.mm);
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
    expect(sizes[0]).toBe(SIZE_MIN_MM);
    expect(sizes.at(-1)).toBeLessThanOrEqual(SIZE_MAX_MM);
    expect(new Set(sizes).size).toBe(sizes.length);
  });
});
