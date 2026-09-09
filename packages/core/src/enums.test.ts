import type { FactorKind } from './factors';
import {
  DERIVED_FACTORS,
  FACTOR_KINDS,
  FACTOR_KIND_LABELS,
  TRIGGER_KINDS,
  isFactorKind
} from './factors';
import type { SoreSurface } from './surfaces';
import {
  SORE_SURFACES,
  SURFACE_LABELS,
  SURFACE_SHORT_LABELS,
  isSoreSurface
} from './surfaces';

describe('SORE_SURFACES', () => {
  it('has no duplicate members', () => {
    expect(new Set(SORE_SURFACES).size).toBe(SORE_SURFACES.length);
  });

  it('has a label and a short label for every surface', () => {
    for (const surface of SORE_SURFACES) {
      expect(SURFACE_LABELS[surface]).toBeTruthy();
      expect(SURFACE_SHORT_LABELS[surface]).toBeTruthy();
    }
  });

  it('has no extra keys in either label map', () => {
    expect(Object.keys(SURFACE_LABELS).sort()).toEqual([...SORE_SURFACES].sort());
    expect(Object.keys(SURFACE_SHORT_LABELS).sort()).toEqual([...SORE_SURFACES].sort());
  });

  it('keeps short labels no longer than full labels', () => {
    for (const surface of SORE_SURFACES) {
      expect(SURFACE_SHORT_LABELS[surface].length).toBeLessThanOrEqual(
        SURFACE_LABELS[surface].length
      );
    }
  });
});

describe('isSoreSurface', () => {
  it('accepts every declared surface', () => {
    expect(SORE_SURFACES.every(isSoreSurface)).toBe(true);
  });

  it('rejects unknown strings and non-strings', () => {
    expect(isSoreSurface('uvula')).toBe(false);
    expect(isSoreSurface('')).toBe(false);
    expect(isSoreSurface('Cheek_Left')).toBe(false);
    expect(isSoreSurface(null)).toBe(false);
    expect(isSoreSurface(undefined)).toBe(false);
    expect(isSoreSurface(0)).toBe(false);
  });

  it('narrows the type for a checked value', () => {
    const value: unknown = 'gum_upper';
    if (isSoreSurface(value)) {
      const surface: SoreSurface = value;
      expect(SURFACE_LABELS[surface]).toBe('Upper gum');
    } else {
      expect.unreachable();
    }
  });
});

describe('FACTOR_KINDS', () => {
  it('has no duplicate members', () => {
    expect(new Set(FACTOR_KINDS).size).toBe(FACTOR_KINDS.length);
  });

  it('has exactly one label per kind', () => {
    expect(Object.keys(FACTOR_KIND_LABELS).sort()).toEqual([...FACTOR_KINDS].sort());
    for (const kind of FACTOR_KINDS) expect(FACTOR_KIND_LABELS[kind]).toBeTruthy();
  });
});

describe('isFactorKind', () => {
  it('accepts every declared kind', () => {
    expect(FACTOR_KINDS.every(isFactorKind)).toBe(true);
  });

  it('rejects unknown strings and non-strings', () => {
    expect(isFactorKind('weather')).toBe(false);
    expect(isFactorKind('')).toBe(false);
    expect(isFactorKind(null)).toBe(false);
    expect(isFactorKind(['food'])).toBe(false);
  });
});

describe('TRIGGER_KINDS', () => {
  it('excludes treatment', () => {
    expect(TRIGGER_KINDS).not.toContain('treatment');
  });

  it('is a subset of FACTOR_KINDS', () => {
    for (const kind of TRIGGER_KINDS) expect(FACTOR_KINDS).toContain(kind);
  });

  it('covers every kind except treatment', () => {
    const expected = FACTOR_KINDS.filter((k): k is FactorKind => k !== 'treatment');
    expect([...TRIGGER_KINDS].sort()).toEqual([...expected].sort());
  });

  it('has no duplicates', () => {
    expect(new Set(TRIGGER_KINDS).size).toBe(TRIGGER_KINDS.length);
  });
});

describe('DERIVED_FACTORS', () => {
  const entries = Object.values(DERIVED_FACTORS);

  it('namespaces every id so it cannot collide with a uuid', () => {
    for (const factor of entries) expect(factor.id.startsWith('derived:')).toBe(true);
    expect(new Set(entries.map((f) => f.id)).size).toBe(entries.length);
  });

  it('uses a real factor kind and a name', () => {
    for (const factor of entries) {
      expect(isFactorKind(factor.kind)).toBe(true);
      expect(factor.name.length).toBeGreaterThan(0);
    }
  });

  it('keeps thresholds inside the 0..4 scale', () => {
    expect(DERIVED_FACTORS.poorSleep.threshold).toBe(1);
    expect(DERIVED_FACTORS.highStress.threshold).toBe(3);
    for (const factor of entries) {
      expect(factor.threshold).toBeGreaterThanOrEqual(0);
      expect(factor.threshold).toBeLessThanOrEqual(4);
    }
  });
});
