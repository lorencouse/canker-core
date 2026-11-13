import {
  Bandage,
  CakeSlice,
  Citrus,
  Coffee,
  Cookie,
  Droplet,
  Droplets,
  Flame,
  Moon,
  Nut,
  Stethoscope,
  Thermometer,
  Wine,
  Zap,
  CircleHelp,
  CalendarHeart,
  type LucideIcon
} from 'lucide-react';

import type { Trigger } from '@/utils/day-log';

/**
 * How each trigger is drawn and named on Insights. The icon is a line glyph
 * beside the label, never instead of it; the phrase is the trigger as the
 * subject of a sentence ("Hard food came before 2 of 3 sores"), because the
 * check-in's wording ("Bit my cheek or lip") does not read as one.
 */
const META: Record<Trigger, { icon: LucideIcon; phrase: string }> = {
  Stress: { icon: Zap, phrase: 'Stress' },
  'Poor sleep': { icon: Moon, phrase: 'Poor sleep' },
  'Bit my cheek or lip': { icon: Bandage, phrase: 'A bitten cheek or lip' },
  'Dental work': { icon: Stethoscope, phrase: 'Dental work' },
  'Sharp or hard food': { icon: Cookie, phrase: 'Hard food' },
  'Spicy food': { icon: Flame, phrase: 'Spicy food' },
  'Acidic food': { icon: Droplet, phrase: 'Acidic food' },
  Citrus: { icon: Citrus, phrase: 'Citrus' },
  Nuts: { icon: Nut, phrase: 'Nuts' },
  Chocolate: { icon: CakeSlice, phrase: 'Chocolate' },
  Coffee: { icon: Coffee, phrase: 'Coffee' },
  Alcohol: { icon: Wine, phrase: 'Alcohol' },
  'Toothpaste with SLS': { icon: Droplets, phrase: 'SLS toothpaste' },
  'Feeling ill': { icon: Thermometer, phrase: 'Feeling ill' },
  Period: { icon: CalendarHeart, phrase: 'Your period' }
};

/** A legacy value no longer on the list keeps its own words. */
export const triggerMeta = (trigger: string): { icon: LucideIcon; phrase: string } =>
  META[trigger as Trigger] ?? { icon: CircleHelp, phrase: trigger };

/** The finding as one sentence. */
export const findingSentence = (trigger: string, count: number, of: number) =>
  `${triggerMeta(trigger).phrase} came before ${count} of ${of} sores`;
