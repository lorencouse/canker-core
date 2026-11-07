import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearProgress, readProgress, writeProgress } from './progress';

const memoryStorage = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k)
  };
};

describe('progress', () => {
  let storage: ReturnType<typeof memoryStorage>;
  beforeEach(() => {
    storage = memoryStorage();
    vi.stubGlobal('window', { localStorage: storage });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('round-trips for the same day', () => {
    writeProgress('2026-11-06', 'sore:A');
    expect(readProgress('2026-11-06')).toBe('sore:A');
  });

  it('reads null for a different day', () => {
    writeProgress('2026-11-05', 'food');
    expect(readProgress('2026-11-06')).toBeNull();
  });

  it('clears', () => {
    writeProgress('2026-11-06', 'food');
    clearProgress();
    expect(readProgress('2026-11-06')).toBeNull();
  });

  it('returns null for malformed JSON or shape', () => {
    storage.setItem('canker-core:check-in', '{nope');
    expect(readProgress('2026-11-06')).toBeNull();
    storage.setItem('canker-core:check-in', '{"day":"2026-11-06"}');
    expect(readProgress('2026-11-06')).toBeNull();
  });

  it('returns null when storage throws', () => {
    vi.stubGlobal('window', {
      localStorage: { getItem: () => { throw new Error('blocked'); } }
    });
    expect(readProgress('2026-11-06')).toBeNull();
  });

  it('is a no-op without window', () => {
    vi.unstubAllGlobals();
    expect(readProgress('2026-11-06')).toBeNull();
    expect(() => writeProgress('2026-11-06', 'x')).not.toThrow();
    expect(() => clearProgress()).not.toThrow();
  });
});
