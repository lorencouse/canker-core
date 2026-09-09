import {
  addDays,
  daysBetween,
  eachDay,
  fromDateKey,
  todayKey,
  type DailyEntry,
  type DateKey,
  type EntryFactor,
  type Factor,
  type FactorKind,
  type Profile,
  type Sore,
  type SoreLog,
  type SoreSurface,
  type UserDataset
} from '@canker/core';

/**
 * The demo dataset. Mirrors `supabase/seed.sql` so every screen shows the same
 * story without a database: one user, seven sores over five months (two still
 * active), a rise-and-fall curve per sore per day, 150 days of daily entries,
 * and Citrus / Coffee / Benzocaine logged in the same correlated way so
 * Insights has a real signal to find.
 *
 * Everything is built relative to today and is deterministic for a given day,
 * so a reload without stored edits reproduces the same rows.
 */

export const DEMO_USER_ID = 'demo-user';
export const DEMO_USER_EMAIL = 'demo@cankercore.test';

export interface DemoState {
  profile: Profile;
  dataset: UserDataset;
}

/** The preset catalogue from the v2 schema migration, verbatim. */
const PRESET_FACTORS: readonly (readonly [FactorKind, string])[] = [
  ['food', 'Citrus'],
  ['food', 'Tomatoes'],
  ['food', 'Spicy food'],
  ['food', 'Chocolate'],
  ['food', 'Coffee'],
  ['food', 'Nuts'],
  ['food', 'Strawberries'],
  ['food', 'Pineapple'],
  ['food', 'Salty snacks'],
  ['food', 'Alcohol'],
  ['food', 'Gluten'],
  ['food', 'Dairy'],
  ['medication', 'Ibuprofen'],
  ['medication', 'Acetaminophen'],
  ['medication', 'Antibiotic'],
  ['medication', 'Vitamin B12'],
  ['medication', 'Iron supplement'],
  ['medication', 'Folate'],
  ['medication', 'Zinc'],
  ['medication', 'Antihistamine'],
  ['treatment', 'Benzocaine gel'],
  ['treatment', 'Salt water rinse'],
  ['treatment', 'Baking soda rinse'],
  ['treatment', 'Hydrogen peroxide rinse'],
  ['treatment', 'Chlorhexidine rinse'],
  ['treatment', 'Steroid paste'],
  ['treatment', 'Canker patch'],
  ['treatment', 'Alum'],
  ['treatment', 'Honey'],
  ['treatment', 'Lysine'],
  ['illness', 'Cold'],
  ['illness', 'Flu'],
  ['illness', 'Fever'],
  ['illness', 'Sore throat'],
  ['illness', 'Stomach upset'],
  ['dental', 'Bit cheek or lip'],
  ['dental', 'Braces or appliance rubbing'],
  ['dental', 'Dental work'],
  ['dental', 'Sharp food injury'],
  ['dental', 'SLS toothpaste'],
  ['dental', 'Toothbrush injury'],
  ['cycle', 'Period started'],
  ['cycle', 'Ovulation'],
  ['other', 'Travel'],
  ['other', 'Big life event']
];

/** Offsets in days before today, matching the seed's five-month history. */
const SORE_SEEDS: readonly {
  n: number;
  surface: SoreSurface;
  x: number;
  y: number;
  onset: number;
  healed: number | null;
}[] = [
  { n: 1, surface: 'cheek_left', x: 0.42, y: 0.55, onset: -140, healed: -131 },
  { n: 2, surface: 'gum_lower', x: 0.3, y: 0.6, onset: -104, healed: -87 },
  { n: 3, surface: 'tongue_left', x: 0.5, y: 0.7, onset: -96, healed: -88 },
  { n: 4, surface: 'lip_lower_inner', x: 0.6, y: 0.4, onset: -62, healed: -53 },
  { n: 5, surface: 'cheek_left', x: 0.38, y: 0.62, onset: -31, healed: -21 },
  { n: 6, surface: 'cheek_left', x: 0.45, y: 0.5, onset: -5, healed: null },
  { n: 7, surface: 'lip_lower_inner', x: 0.35, y: 0.45, onset: -1, healed: null }
];

/** Sores the demo user treated with benzocaine, so the treatment group is comparable. */
const BENZOCAINE_SORE_NUMBERS = [2, 4, 5];

const DAILY_ENTRY_DAYS = 150;

/** Sizes and pains are smallints: 1..30mm and 0..10. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** The seed's curve: size peaks around day 3-4, then both shrink. */
function curve(dayIndex: number): { size_mm: number; pain: number } {
  const phase = (Math.min(dayIndex, 12) / 12) * Math.PI;
  return {
    size_mm: clamp(Math.round(4 + 2 * Math.sin(phase) - dayIndex * 0.15), 1, 30),
    pain: clamp(Math.round(6 * Math.sin(phase) + 1 - dayIndex * 0.2), 0, 10)
  };
}

/** 1-based day of the year, the input to the seed's stress and sleep curves. */
function dayOfYear(date: DateKey): number {
  return daysBetween(`${date.slice(0, 4)}-01-01`, date) + 1;
}

/** 0 = Sunday, matching Postgres `extract(dow from ...)`. */
function dayOfWeek(date: DateKey): number {
  return fromDateKey(date).getUTCDay();
}

export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function buildDemoState(): DemoState {
  const timezone = deviceTimezone();
  const today = todayKey(timezone);

  const factors: Factor[] = PRESET_FACTORS.map(([kind, name], i) => ({
    id: `demo-factor-${i + 1}`,
    user_id: null,
    kind,
    name,
    is_preset: true,
    archived_at: null
  }));
  const factorByName = new Map(factors.map((f) => [f.name, f]));

  const sores: Sore[] = SORE_SEEDS.map((s) => ({
    id: `demo-sore-${s.n}`,
    user_id: DEMO_USER_ID,
    surface: s.surface,
    x: s.x,
    y: s.y,
    onset_date: addDays(today, s.onset),
    healed_date: s.healed === null ? null : addDays(today, s.healed),
    notes: null
  }));

  const soreLogs: SoreLog[] = [];
  for (const sore of sores) {
    const end = sore.healed_date ?? today;
    for (const date of eachDay(sore.onset_date, end)) {
      soreLogs.push({
        id: `demo-log-${sore.id}-${date}`,
        sore_id: sore.id,
        user_id: DEMO_USER_ID,
        log_date: date,
        ...curve(daysBetween(sore.onset_date, date)),
        notes: null,
        logged_late: false
      });
    }
  }

  // Two days before every onset: the window Insights looks in for triggers.
  const preOnsetDays = new Set<DateKey>();
  for (const sore of sores) {
    preOnsetDays.add(addDays(sore.onset_date, -2));
    preOnsetDays.add(addDays(sore.onset_date, -1));
  }

  const dailyEntries: DailyEntry[] = eachDay(
    addDays(today, -DAILY_ENTRY_DAYS),
    today
  ).map((date) => {
    const doy = dayOfYear(date);
    return {
      id: `demo-entry-${date}`,
      user_id: DEMO_USER_ID,
      entry_date: date,
      stress: 1 + (doy % 4),
      // Sleep collapses in the run-up to a sore, so "poor sleep" reads as a trigger.
      sleep_quality: preOnsetDays.has(date) ? 0 : 4 - Math.floor((doy % 5) / 2),
      overall_pain: null,
      notes: null,
      logged_late: false
    };
  });

  const entryFactors: EntryFactor[] = [];
  const citrus = factorByName.get('Citrus');
  const coffee = factorByName.get('Coffee');
  const benzocaine = factorByName.get('Benzocaine gel');

  for (const entry of dailyEntries) {
    // Coffee on weekdays: high overall rate, so it stays a weak lift.
    if (coffee && dayOfWeek(entry.entry_date) >= 1 && dayOfWeek(entry.entry_date) <= 5) {
      entryFactors.push(entryFactor(entry.id, coffee.id, null));
    }
    // Citrus only in the pre-onset window: a strong lift.
    if (citrus && preOnsetDays.has(entry.entry_date)) {
      entryFactors.push(entryFactor(entry.id, citrus.id, null));
    }
  }

  if (benzocaine) {
    const entryDates = new Map(dailyEntries.map((e) => [e.entry_date, e.id]));
    for (const sore of sores) {
      const n = Number(sore.id.slice('demo-sore-'.length));
      if (!BENZOCAINE_SORE_NUMBERS.includes(n)) continue;
      for (const date of eachDay(sore.onset_date, sore.healed_date ?? today)) {
        const entryId = entryDates.get(date);
        if (entryId) entryFactors.push(entryFactor(entryId, benzocaine.id, sore.id));
      }
    }
  }

  const profile: Profile = {
    id: DEMO_USER_ID,
    full_name: 'Demo User',
    avatar_url: null,
    timezone,
    reminder_at: '20:30',
    reminder_enabled: true,
    plan: 'free',
    // Set so the first-run gate in AppShell never fires in demo mode.
    onboarded_at: new Date(fromDateKey(addDays(today, -DAILY_ENTRY_DAYS))).toISOString()
  };

  return {
    profile,
    dataset: { sores, soreLogs, dailyEntries, factors, entryFactors }
  };
}

function entryFactor(
  dailyEntryId: string,
  factorId: string,
  soreId: string | null
): EntryFactor {
  return {
    id: `demo-ef-${dailyEntryId}-${factorId}-${soreId ?? 'none'}`,
    daily_entry_id: dailyEntryId,
    factor_id: factorId,
    user_id: DEMO_USER_ID,
    sore_id: soreId,
    detail: null
  };
}
