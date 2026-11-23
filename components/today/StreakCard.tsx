import {
  SparkleField,
  StarMark,
  type Sparkle
} from '@/components/graphics/Sparkles';
import Kanko from '@/components/kanko/Kanko';
import type { KankoMood } from '@/components/kanko/moods';
import InfoButton from '@/components/ui/info-button';
import type { DayLog, Sore } from '@/types';
import { cn } from '@/utils/cn';
import { dayKey, parseDay } from '@/utils/days';
import {
  type Mood,
  bestTriggerFreeStreak,
  hasLoggedDay,
  streakBarLine,
  streakHeadline,
  streakVoice,
  todayMood,
  triggerFreeStreak,
  weekDots
} from '@/utils/momentum';

/*
 * Where the marks sit around Kanko. Fixed, not random, so the server and
 * the device draw the same picture.
 */
const WIN_SPARKLES: Sparkle[] = [
  { top: '2%', left: '4%', size: 14, delay: 0 },
  { top: '8%', left: '80%', size: 10, tone: 'comfort', delay: 0.9 },
  { top: '78%', left: '2%', size: 9, shape: 'star', delay: 1.6 },
  {
    top: '70%',
    left: '86%',
    size: 12,
    shape: 'star',
    tone: 'comfort',
    delay: 0.4
  }
];
const CALM_SPARKLES: Sparkle[] = [
  { top: '6%', left: '6%', size: 11, tone: 'comfort', delay: 0 },
  { top: '74%', left: '84%', size: 9, tone: 'comfort', delay: 1.2 }
];

/**
 * Kanko and the streak in one card, as the Momentum spec drew it: Kanko
 * beside one line in his voice, the indigo streak bar with the figure in
 * sunflower, and the last seven days as dots. A logged day is a star
 * (sunflower when trigger-free, pressing like a key; lavender when it had a
 * trigger) and today wears an outline.
 *
 * On a bad day the card goes quiet, as the spec asks: gentle Kanko, "Rough
 * one today", no figure and no sparkles, so a sore never meets a zero. A new
 * account gets a first-day line instead of a zero too.
 *
 * `now` is null until the device clock is read: the card then draws its
 * frame at full size with `expectedMood`'s Kanko and no words, so nothing
 * moves when the real day arrives. `celebrate` swaps Kanko's pose for a
 * moment (the medal on a day a sore healed) at the same size.
 */
export default function StreakCard({
  sores,
  logs,
  now,
  expectedMood = 'neutral',
  celebrate,
  className
}: {
  sores: Sore[];
  logs: DayLog[];
  now: Date | null;
  expectedMood?: Mood;
  celebrate?: KankoMood;
  className?: string;
}) {
  const today = now ? dayKey(now) : null;
  const mood: Mood = now ? todayMood(sores, logs, now) : expectedMood;
  const streak = today ? triggerFreeStreak(logs, today) : 0;
  const best = today ? bestTriggerFreeStreak(logs, today) : 0;
  const dots = today ? weekDots(logs, today) : null;
  const voice = streakVoice(mood, streak, logs);
  const words = streakHeadline(voice, streak);
  // Before the clock, the frame follows the server's guess, which is
  // 'proud' only when it expects a streak.
  const showBar = today
    ? voice === 'strong'
    : expectedMood === 'proud' && hasLoggedDay(logs);
  const gentle = mood === 'gentle' && !celebrate;
  const winning = Boolean(today) && voice === 'strong';

  return (
    <section
      aria-label="Your streak"
      className={cn(
        // Dark Kanko art is drawn on the page ground, so the card takes that
        // ground in dark mode rather than showing a square behind him.
        'surface-worksheet relative p-4 dark:bg-background',
        className
      )}
    >
      <InfoButton
        title="Your streak"
        className="absolute right-3 top-3"
        label="About your streak"
      >
        <p>
          A streak counts days logged with no triggers. Poor sleep and a stress
          of 4 or 5 count as triggers too.
        </p>
        <p>
          A sunflower star is a trigger-free day. A lavender star is a day
          logged with a trigger. Today has the outline.
        </p>
      </InfoButton>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 pr-8">
        <div className="relative size-20 min-[360px]:size-24">
          <Kanko
            mood={celebrate ?? (gentle ? 'gentle' : mood)}
            size={96}
            priority
            className="size-20 min-[360px]:size-24"
          />
          {today && !gentle && (
            <SparkleField
              sparkles={winning || celebrate ? WIN_SPARKLES : CALM_SPARKLES}
            />
          )}
        </div>

        <div className={cn('min-w-0', !today && 'invisible')}>
          <p className="text-balance font-display text-section font-extrabold">
            {words.headline}
          </p>
          <p className="mt-1 text-pretty text-muted-foreground">{words.line}</p>
        </div>
      </div>

      {showBar && (
        <p className="mt-4 flex items-center gap-3.5 rounded-worksheet bg-streak px-4 py-3 text-streak-foreground shadow-press-streak">
          {/* Not through cn: tailwind-merge reads text-display as a colour
              and would drop it in favour of text-win. */}
          <span
            className={`tabular min-w-[1.4ch] text-center font-display text-display font-extrabold leading-none text-win${today ? '' : ' invisible'}`}
          >
            {today ? streak : 0}
          </span>
          <span className={cn('flex min-w-0 flex-col', !today && 'invisible')}>
            <span className="font-extrabold leading-tight">
              trigger-free {streak === 1 ? 'day' : 'days'}
            </span>
            <span className="text-sm opacity-90">
              {streakBarLine(streak, best)}
            </span>
          </span>
        </p>
      )}

      <ol
        aria-label="Last seven days"
        className={cn('grid grid-cols-7 gap-1', showBar ? 'mt-5' : 'mt-4')}
      >
        {(dots ?? PLACEHOLDER_DOTS).map((dot) => (
          <li key={dot.day} className="flex flex-col items-center gap-1">
            <span
              aria-hidden="true"
              className={cn(
                'grid size-8 place-items-center rounded-full',
                dot.won
                  ? 'bg-win text-win-foreground shadow-press-win-sm'
                  : dot.logged
                    ? 'bg-comfort text-win-foreground'
                    : 'bg-secondary',
                dot.isToday &&
                  'ring-2 ring-primary ring-offset-2 ring-offset-card dark:ring-offset-background'
              )}
            >
              {dot.logged && <StarMark size={16} />}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'text-xs',
                dot.isToday
                  ? 'font-bold text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {dot.initial || ' '}
            </span>
            {dots && (
              <span className="sr-only">
                {spokenDay(dot.day)}
                {dot.isToday ? ', today' : ''}:{' '}
                {dot.won
                  ? 'trigger-free'
                  : dot.logged
                    ? 'logged, with a trigger'
                    : 'not logged'}
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

const spokenDay = (day: string) =>
  parseDay(day).toLocaleDateString(undefined, { weekday: 'long' });

// The frame before the clock is read: seven empty dots, no letters.
const PLACEHOLDER_DOTS = Array.from({ length: 7 }, (_, i) => ({
  day: `pending-${i}`,
  initial: '',
  logged: false,
  won: false,
  isToday: false
}));
