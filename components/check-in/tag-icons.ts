import {
  Ban,
  Candy,
  Citrus,
  Coffee,
  Cookie,
  Droplet,
  Droplets,
  Flame,
  Nut,
  Pill,
  Pipette,
  Shield,
  Snowflake,
  Soup,
  Stethoscope,
  Tablets,
  Thermometer,
  Waves,
  Wine,
  type LucideIcon
} from 'lucide-react';

import { FOOD_TRIGGERS, HEALTH_TRIGGERS, TREATMENTS } from '@/utils/day-log';

type Option =
  | (typeof FOOD_TRIGGERS)[number]
  | (typeof HEALTH_TRIGGERS)[number]
  | (typeof TREATMENTS)[number];

/**
 * A line icon for each check-in chip whose meaning one clear glyph carries.
 * Null where none does (acidic food, a bitten cheek, a toothpaste): an icon
 * that has to be explained is worse than a word on its own. Every option is
 * listed, so a new one gets the same decision rather than silently none.
 */
export const TAG_ICONS: Record<Option, LucideIcon | null> = {
  'Sharp or hard food': Cookie,
  'Spicy food': Flame,
  'Acidic food': null,
  Citrus: Citrus,
  Nuts: Nut,
  Chocolate: Candy,
  Coffee: Coffee,
  Alcohol: Wine,
  'Feeling ill': Thermometer,
  Period: Droplet,
  'Bit my cheek or lip': null,
  'Dental work': Stethoscope,
  'Toothpaste with SLS': null,
  'Salt-water rinse': Waves,
  'Antiseptic mouthwash': Droplets,
  'Numbing gel': Snowflake,
  'Steroid paste': Pipette,
  'Protective paste': Shield,
  Painkiller: Pill,
  'Vitamin B12': Tablets,
  'Avoided trigger foods': Ban,
  'Soft foods only': Soup
};

export const tagIcon = (option: string): LucideIcon | undefined =>
  (TAG_ICONS as Record<string, LucideIcon | null>)[option] ?? undefined;
