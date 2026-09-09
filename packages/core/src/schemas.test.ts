import type { ZodIssue, ZodTypeAny } from 'zod';
import type { NewSoreInput } from './schemas';
import {
  dailyEntryInputSchema,
  dateKeySchema,
  emailSchema,
  factorKindSchema,
  fourPointSchema,
  newFactorSchema,
  newSoreSchema,
  painSchema,
  passwordSchema,
  profileUpdateSchema,
  sizeMmSchema,
  soreLogInputSchema,
  soreSurfaceSchema,
  unitIntervalSchema,
  updateSoreSchema
} from './schemas';

/** Asserts the value is rejected and hands back the issues for path checks. */
function issuesFor(schema: ZodTypeAny, value: unknown): ZodIssue[] {
  const result = schema.safeParse(value);
  expect(result.success).toBe(false);
  return result.success ? [] : result.error.issues;
}

const UUID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const validSore: NewSoreInput = {
  surface: 'cheek_left',
  x: 0.25,
  y: 0.75,
  onset_date: '2026-09-09',
  size_mm: 4,
  pain: 3
};

describe('dateKeySchema', () => {
  it('accepts a zero-padded key', () => {
    expect(dateKeySchema.parse('2026-09-09')).toBe('2026-09-09');
  });

  it('rejects an unpadded key with the expected message', () => {
    const issues = issuesFor(dateKeySchema, '2026-9-9');
    expect(issues[0]?.message).toBe('Expected a YYYY-MM-DD date');
  });

  it('rejects non-date strings', () => {
    issuesFor(dateKeySchema, '');
    issuesFor(dateKeySchema, '2026-09-09T00:00:00Z');
    issuesFor(dateKeySchema, 20260909);
  });
});

describe('primitive schemas', () => {
  it('bounds the unit interval to 0..1', () => {
    expect(unitIntervalSchema.parse(0)).toBe(0);
    expect(unitIntervalSchema.parse(1)).toBe(1);
    issuesFor(unitIntervalSchema, -0.01);
    issuesFor(unitIntervalSchema, 1.01);
  });

  it('bounds pain to whole 0..10', () => {
    expect(painSchema.parse(10)).toBe(10);
    issuesFor(painSchema, 11);
    issuesFor(painSchema, -1);
    issuesFor(painSchema, 2.5);
  });

  it('bounds size to whole 1..30 mm', () => {
    expect(sizeMmSchema.parse(1)).toBe(1);
    expect(sizeMmSchema.parse(30)).toBe(30);
    issuesFor(sizeMmSchema, 0);
    issuesFor(sizeMmSchema, 31);
    issuesFor(sizeMmSchema, 1.5);
  });

  it('bounds the four point scale to whole 0..4', () => {
    expect(fourPointSchema.parse(4)).toBe(4);
    issuesFor(fourPointSchema, 5);
    issuesFor(fourPointSchema, -1);
  });

  it('accepts only known enum members', () => {
    expect(soreSurfaceSchema.parse('tongue_left')).toBe('tongue_left');
    expect(factorKindSchema.parse('treatment')).toBe('treatment');
    issuesFor(soreSurfaceSchema, 'left_ear');
    issuesFor(factorKindSchema, 'weather');
  });
});

describe('newSoreSchema', () => {
  it('parses a complete sore', () => {
    expect(newSoreSchema.parse(validSore)).toEqual(validSore);
  });

  it('accepts notes omitted, null or trimmed', () => {
    expect(newSoreSchema.parse(validSore).notes).toBeUndefined();
    expect(newSoreSchema.parse({ ...validSore, notes: null }).notes).toBeNull();
    expect(newSoreSchema.parse({ ...validSore, notes: '  sharp  ' }).notes).toBe('sharp');
  });

  it('rejects a fractional-but-out-of-range coordinate', () => {
    expect(issuesFor(newSoreSchema, { ...validSore, x: 1.1 })[0]?.path).toEqual(['x']);
    expect(issuesFor(newSoreSchema, { ...validSore, y: -0.5 })[0]?.path).toEqual(['y']);
  });

  it('rejects sizes outside 1..30 mm', () => {
    expect(issuesFor(newSoreSchema, { ...validSore, size_mm: 0 })[0]?.path).toEqual([
      'size_mm'
    ]);
    expect(issuesFor(newSoreSchema, { ...validSore, size_mm: 31 })[0]?.path).toEqual([
      'size_mm'
    ]);
  });

  it('rejects pain above 10', () => {
    expect(issuesFor(newSoreSchema, { ...validSore, pain: 11 })[0]?.path).toEqual([
      'pain'
    ]);
  });

  it('rejects notes longer than 500 characters', () => {
    expect(newSoreSchema.safeParse({ ...validSore, notes: 'x'.repeat(500) }).success).toBe(
      true
    );
    expect(issuesFor(newSoreSchema, { ...validSore, notes: 'x'.repeat(501) })[0]?.path)
      .toEqual(['notes']);
  });

  it('rejects a missing required field', () => {
    const { surface: _surface, ...withoutSurface } = validSore;
    expect(issuesFor(newSoreSchema, withoutSurface)[0]?.path).toEqual(['surface']);
  });
});

describe('updateSoreSchema', () => {
  it('accepts an empty patch and a partial one', () => {
    expect(updateSoreSchema.parse({})).toEqual({});
    expect(updateSoreSchema.parse({ healed_date: '2026-09-20' })).toEqual({
      healed_date: '2026-09-20'
    });
    expect(updateSoreSchema.parse({ healed_date: null, notes: null })).toEqual({
      healed_date: null,
      notes: null
    });
  });

  it('still validates the fields that are present', () => {
    expect(issuesFor(updateSoreSchema, { healed_date: '2026-9-20' })[0]?.path).toEqual([
      'healed_date'
    ]);
    expect(issuesFor(updateSoreSchema, { x: 2 })[0]?.path).toEqual(['x']);
  });
});

describe('soreLogInputSchema', () => {
  it('parses a complete log', () => {
    expect(
      soreLogInputSchema.parse({
        sore_id: UUID,
        log_date: '2026-09-09',
        size_mm: 5,
        pain: 6
      })
    ).toEqual({ sore_id: UUID, log_date: '2026-09-09', size_mm: 5, pain: 6 });
  });

  it('requires sore_id to be a uuid', () => {
    const issues = issuesFor(soreLogInputSchema, {
      sore_id: 'sore-1',
      log_date: '2026-09-09',
      size_mm: 5,
      pain: 6
    });
    expect(issues[0]?.path).toEqual(['sore_id']);
  });

  it('treats notes and logged_late as optional', () => {
    const parsed = soreLogInputSchema.parse({
      sore_id: UUID,
      log_date: '2026-09-09',
      size_mm: 5,
      pain: 6,
      notes: null,
      logged_late: true
    });
    expect(parsed.logged_late).toBe(true);
    expect(parsed.notes).toBeNull();
  });
});

describe('dailyEntryInputSchema', () => {
  it('accepts only the entry date', () => {
    expect(dailyEntryInputSchema.parse({ entry_date: '2026-09-09' })).toEqual({
      entry_date: '2026-09-09'
    });
  });

  it('accepts partial fields, including nulls', () => {
    const parsed = dailyEntryInputSchema.parse({
      entry_date: '2026-09-09',
      stress: 4,
      sleep_quality: null,
      overall_pain: 0,
      notes: '  rough day  '
    });
    expect(parsed).toEqual({
      entry_date: '2026-09-09',
      stress: 4,
      sleep_quality: null,
      overall_pain: 0,
      notes: 'rough day'
    });
  });

  it('rejects a stress score above the 0..4 scale', () => {
    expect(
      issuesFor(dailyEntryInputSchema, { entry_date: '2026-09-09', stress: 5 })[0]?.path
    ).toEqual(['stress']);
  });

  it('requires the entry date', () => {
    expect(issuesFor(dailyEntryInputSchema, {})[0]?.path).toEqual(['entry_date']);
  });

  it('rejects notes longer than 1000 characters', () => {
    expect(
      issuesFor(dailyEntryInputSchema, {
        entry_date: '2026-09-09',
        notes: 'x'.repeat(1001)
      })[0]?.path
    ).toEqual(['notes']);
  });
});

describe('newFactorSchema', () => {
  it('trims the name', () => {
    expect(newFactorSchema.parse({ kind: 'food', name: '  Tomatoes  ' })).toEqual({
      kind: 'food',
      name: 'Tomatoes'
    });
  });

  it('rejects an empty or whitespace-only name', () => {
    expect(issuesFor(newFactorSchema, { kind: 'food', name: '' })[0]?.message).toBe(
      'Give it a name'
    );
    expect(issuesFor(newFactorSchema, { kind: 'food', name: '   ' })[0]?.message).toBe(
      'Give it a name'
    );
  });

  it('allows 60 characters but not 61', () => {
    expect(
      newFactorSchema.safeParse({ kind: 'food', name: 'a'.repeat(60) }).success
    ).toBe(true);
    expect(
      issuesFor(newFactorSchema, { kind: 'food', name: 'a'.repeat(61) })[0]?.path
    ).toEqual(['name']);
  });

  it('rejects an unknown kind', () => {
    expect(issuesFor(newFactorSchema, { kind: 'snack', name: 'Chips' })[0]?.path).toEqual(
      ['kind']
    );
  });
});

describe('profileUpdateSchema', () => {
  it('accepts an empty patch', () => {
    expect(profileUpdateSchema.parse({})).toEqual({});
  });

  it('accepts HH:MM and HH:MM:SS reminder times, and null', () => {
    expect(profileUpdateSchema.parse({ reminder_at: '08:30' }).reminder_at).toBe('08:30');
    expect(profileUpdateSchema.parse({ reminder_at: '21:00:00' }).reminder_at).toBe(
      '21:00:00'
    );
    expect(profileUpdateSchema.parse({ reminder_at: null }).reminder_at).toBeNull();
  });

  it('rejects an unpadded hour', () => {
    const issues = issuesFor(profileUpdateSchema, { reminder_at: '8:30' });
    expect(issues[0]?.path).toEqual(['reminder_at']);
    expect(issues[0]?.message).toBe('Expected HH:MM');
  });

  it('rejects an empty timezone and an over-long name', () => {
    expect(issuesFor(profileUpdateSchema, { timezone: '' })[0]?.path).toEqual([
      'timezone'
    ]);
    expect(issuesFor(profileUpdateSchema, { full_name: 'a'.repeat(81) })[0]?.path).toEqual(
      ['full_name']
    );
  });
});

describe('emailSchema / passwordSchema', () => {
  it('trims and accepts a valid email', () => {
    expect(emailSchema.parse('  someone@example.com ')).toBe('someone@example.com');
  });

  it('reports a friendly message for an invalid email', () => {
    expect(issuesFor(emailSchema, 'someone@')[0]?.message).toBe(
      'Enter a valid email address'
    );
  });

  it('requires at least 8 password characters', () => {
    expect(passwordSchema.parse('12345678')).toBe('12345678');
    expect(issuesFor(passwordSchema, '1234567')[0]?.message).toBe(
      'Use at least 8 characters'
    );
  });
});
