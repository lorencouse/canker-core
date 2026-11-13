import { SparkleField, StarMark, type Sparkle } from '@/components/graphics/Sparkles';
import Kanko from '@/components/kanko/Kanko';
import type { KankoMood } from '@/components/kanko/moods';
import InfoButton from '@/components/ui/info-button';
import type { DayLog, Sore } from '@/types';
import { cn } from '@/utils/cn';
import { dayKey, parseDay } from '@/utils/days';
import {
  type Mood,
  bestTriggerFreeStreak,
  streakLabel,
  todayMood,
  triggerFreeStreak,
  weekDots
} from '@/utils/momentum';

/** A week is the ring's lap: it fills over seven trigger-free days. */
const LAP = 7;

/*
 * Where the marks sit around Kanko. Fixed, not random, so the server and
 * the device draw the same picture.
 */
const WIN_SPARKLES: Sparkle[] = [
  { top: '2%', left: '4%', size: 14, delay: 0 },
  { top: '8%', left: '80%', size: 10, tone: 'comfort', delay: 0.9 },
  { top: '78%', left: '2%', size: 9, shape: 'star', delay: 1.6 },
  { top: '70%', left: '86%', size: 12, shape: 'star', tone: 'comfort', delay: 0.4 }
];
const CALM_SPARKLES: Sparkle[] = [
  { top: '6%', left: '6%', size: 11, tone: 'comfort', delay: 0 },
  { top: '74%', left: '84%', size: 9, tone: 'comfort', delay: 1.2 }
];

/**
 * Kanko and the streak in one card: the figure once, in a ring that fills
 * over a week, and the last seven days as dots. A logged day is a star
 * (sunflower when trigger-free, lavender when it had a trigger) and today
 * wears an outline, so the dots mean something without a sentence. The
 * legend is behind the "i".
 *
 * `now` is null until the device clock is read: the card then draws its
 * frame at full size with `expectedMood`'s Kanko and no figures, so nothing
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

  const winning = Boolean(today) && streak > 0 && mood !== 'gentle';
  const label = streak > 0 ? streakLabel(streak) : 'No streak yet';
  const sub =
    mood === 'gentle'
      ? 'Rough one today'
      : best > streak
        ? `Best ${best}`
        : streak > 0
          ? 'Your best yet'
          : 'Log a day to start';

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
          A streak counts days logged with no triggers. The ring fills over a
          week.
        </p>
        <p>
          A sunflower star is a trigger-free day. A lavender star is a day
          logged with a trigger. Today has the outline.
        </p>
      </InfoButton>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 pr-8">
        <div className="relative size-24">
          <Kanko
            mood={celebrate ?? mood}
            size={96}
            priority
            className="size-24"
          />
          {today && (
            <SparkleField
              sparkles={winning || celebrate ? WIN_SPARKLES : CALM_SPARKLES}
            />
          )}
        </div>

        {/* Under 360px the words go under the ring, so they never cut off. */}
        <div className="flex min-w-0 flex-col items-start gap-1.5 min-[360px]:flex-row min-[360px]:items-center min-[360px]:gap-3">
          <StreakRing streak={today ? streak : null} />
          <div className={cn('min-w-0', !today && 'invisible')}>
            <p className="truncate font-display text-subhead font-bold leading-tight">
              {label}
            </p>
            <p className="tabular truncate text-sm text-muted-foreground">
              {sub}
            </p>
          </div>
        </div>
      </div>

      <ol
        aria-label="Last seven days"
        className="mt-3 grid grid-cols-7 gap-1"
      >
        {(dots ?? PLACEHOLDER_DOTS).map((dot) => (
          <li key={dot.day} className="flex flex-col items-center gap-1">
            <span
              aria-hidden="true"
              className={cn(
                'grid size-8 place-items-center rounded-full',
                dot.won
                  ? 'bg-win text-win-foreground'
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
              {dot.initial || ' '}
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

/**
 * The streak figure inside a ring that fills over a week, with a sunflower
 * star badge once there is a streak. Null draws the empty ring only.
 */
function StreakRing({ streak }: { streak: number | null }) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const lap = streak ? Math.min(streak, LAP) / LAP : 0;
  return (
    <span className="relative grid size-16 shrink-0 place-items-center">
      <svg
        viewBox="0 0 64 64"
        className="absolute inset-0 size-16 -rotate-90"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="6"
        />
        {lap > 0 && (
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke="hsl(var(--win))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${lap * circumference} ${circumference}`}
          />
        )}
      </svg>
      <span className="tabular relative font-display text-figure font-extrabold">
        {streak ?? ' '}
      </span>
      {Boolean(streak) && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-win text-win-foreground ring-2 ring-card dark:ring-background"
        >
          <StarMark size={14} />
        </span>
      )}
    </span>
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
