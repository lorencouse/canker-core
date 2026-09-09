import { z } from 'zod';
import { FACTOR_KINDS } from './factors';
import { PAIN_MAX, PAIN_MIN, SIZE_MAX_MM, SIZE_MIN_MM } from './pain';
import { SORE_SURFACES } from './surfaces';

/**
 * Validation for every write the app performs. The same schemas drive form
 * validation and are the single source of truth for numeric ranges.
 */

export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD date');

export const soreSurfaceSchema = z.enum(SORE_SURFACES);
export const factorKindSchema = z.enum(FACTOR_KINDS);

export const unitIntervalSchema = z.number().min(0).max(1);
export const painSchema = z.number().int().min(PAIN_MIN).max(PAIN_MAX);
export const sizeMmSchema = z.number().int().min(SIZE_MIN_MM).max(SIZE_MAX_MM);
export const fourPointSchema = z.number().int().min(0).max(4);

export const newSoreSchema = z.object({
  surface: soreSurfaceSchema,
  x: unitIntervalSchema,
  y: unitIntervalSchema,
  onset_date: dateKeySchema,
  notes: z.string().trim().max(500).nullable().optional(),
  /** The first observation, written as a log for `onset_date`. */
  size_mm: sizeMmSchema,
  pain: painSchema
});
export type NewSoreInput = z.infer<typeof newSoreSchema>;

export const updateSoreSchema = z
  .object({
    surface: soreSurfaceSchema,
    x: unitIntervalSchema,
    y: unitIntervalSchema,
    onset_date: dateKeySchema,
    healed_date: dateKeySchema.nullable(),
    notes: z.string().trim().max(500).nullable()
  })
  .partial();
export type UpdateSoreInput = z.infer<typeof updateSoreSchema>;

export const soreLogInputSchema = z.object({
  sore_id: z.string().uuid(),
  log_date: dateKeySchema,
  size_mm: sizeMmSchema,
  pain: painSchema,
  notes: z.string().trim().max(500).nullable().optional(),
  logged_late: z.boolean().optional()
});
export type SoreLogInput = z.infer<typeof soreLogInputSchema>;

export const dailyEntryInputSchema = z.object({
  entry_date: dateKeySchema,
  stress: fourPointSchema.nullable().optional(),
  sleep_quality: fourPointSchema.nullable().optional(),
  overall_pain: painSchema.nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  logged_late: z.boolean().optional()
});
export type DailyEntryInput = z.infer<typeof dailyEntryInputSchema>;

export const newFactorSchema = z.object({
  kind: factorKindSchema,
  name: z.string().trim().min(1, 'Give it a name').max(60)
});
export type NewFactorInput = z.infer<typeof newFactorSchema>;

export const profileUpdateSchema = z
  .object({
    full_name: z.string().trim().max(80).nullable(),
    timezone: z.string().min(1),
    reminder_at: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Expected HH:MM')
      .nullable(),
    reminder_enabled: z.boolean(),
    onboarded_at: z.string().nullable()
  })
  .partial();
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const emailSchema = z.string().trim().email('Enter a valid email address');
export const passwordSchema = z.string().min(8, 'Use at least 8 characters');
