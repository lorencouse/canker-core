import { describe, expect, it } from 'vitest';

import type { Sore } from '@/types';
import { nearbySores } from './nearby';

const sore = (id: string, overrides: Partial<Sore> = {}): Sore => ({
  id,
  user_id: 'u',
  view: 'lips',
  x: 50,
  y: 75,
  zone: 'Lower lip',
  created_at: '2026-10-22T12:00:00Z',
  healed_at: null,
  readings: [],
  ...overrides
});

describe('nearbySores', () => {
  const current = sore('now');

  it('finds an earlier sore a few millimetres away on the same view', () => {
    const july = sore('july', {
      x: 49,
      y: 74,
      created_at: '2026-07-08T12:00:00Z'
    });
    expect(nearbySores(current, [current, july]).map((s) => s.id)).toEqual([
      'july'
    ]);
  });

  it('ignores sores on another view, far away, or newer than this one', () => {
    const cheek = sore('cheek', {
      view: 'cheeks',
      created_at: '2026-07-01T12:00:00Z'
    });
    const far = sore('far', {
      x: 20,
      y: 30,
      created_at: '2026-07-01T12:00:00Z'
    });
    const later = sore('later', {
      x: 50,
      y: 75,
      created_at: '2026-10-25T12:00:00Z'
    });
    expect(nearbySores(current, [current, cheek, far, later])).toEqual([]);
  });

  it('lists the most recent first', () => {
    const a = sore('a', { created_at: '2026-03-01T12:00:00Z' });
    const b = sore('b', { created_at: '2026-08-01T12:00:00Z' });
    expect(nearbySores(current, [a, b]).map((s) => s.id)).toEqual(['b', 'a']);
  });
});
