import Kanko from '@/components/kanko/Kanko';
import type { KankoMood } from '@/components/kanko/moods';
import type { DayLog, Sore } from '@/types';
import type { Answer } from '@/utils/course';
import {
  type Mood,
  streakCardLabel,
  streakHeadline,
  todayMood,
  triggerFreeStreak,
  weekDots
} from '@/utils/momentum';
import { dayKey } from '@/utils/readings';

/**
 * The top of Today: Kanko, the day's headline and, on a trigger-free run,
 * the streak. Mood, streak and week dots come from the sores and logs passed
 * in, which the caller keeps to what has been saved, so dragging a slider
 * never changes them. In the neutral state the headline and note come from
 * `answer`, which deliberately follows unsaved edits.
 *
 * `celebrate` swaps Kanko's pose for a moment (the medal, just after a sore
 * is marked healed) at the same size, so nothing moves and there is only
 * ever one Kanko on the screen.
 */
export default function StreakBlock({
  sores,
  logs,
  now,
  answer,
  celebrate
}: {
  sores: Sore[];
  logs: DayLog[];
  now: Date;
  answer: Answer;
  celebrate?: KankoMood;
}) {
  const today = dayKey(now);
  const mood = todayMood(sores, logs, now);
  const streak = triggerFreeStreak(logs, today);

  const dateLine = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const headline =
    mood === 'proud'
      ? streakHeadline(streak)
      : mood === 'gentle'
        ? 'Rough one today.'
        : answer.headline;
  const line =
    mood === 'proud'
      ? 'Your mouth is thanking you.'
      : mood === 'gentle'
        ? 'Logged. That’s the hard part done.'
        : answer.note;

  return (
    <header className="flex flex-col items-center text-center lg:col-span-2">
      <time dateTime={today} className="text-sm text-muted-foreground">
        {dateLine}
      </time>
      <Kanko
        mood={celebrate ?? mood}
        size={176}
        priority
        className="-my-1 size-44"
      />
      <h1 className="text-balance text-2xl leading-tight lg:text-3xl">
        {headline}
      </h1>
      {line && <p className="prose-measure mt-1.5">{line}</p>}

      {mood === 'proud' && (
        <>
          <div className="mt-4 flex w-full max-w-sm items-center justify-center gap-3 rounded-worksheet bg-streak px-4 py-3 text-streak-foreground shadow-[0_5px_0_hsl(var(--streak-edge))]">
            <span className="tabular whitespace-nowrap font-display text-4xl font-extrabold leading-none text-win">
              {streak}
            </span>
            <span className="font-bold">{streakCardLabel(streak)}</span>
          </div>
          <ol
            aria-label="Last seven days"
            className="mt-5 flex w-full max-w-sm justify-between"
          >
            {weekDots(logs, today).map((dot) => (
              <li
                key={dot.day}
                className={
                  dot.won
                    ? 'grid size-8 place-items-center rounded-full bg-win text-xs font-extrabold text-win-foreground shadow-press-win'
                    : 'grid size-8 place-items-center rounded-full bg-border text-xs font-extrabold text-muted-foreground'
                }
              >
                <span aria-hidden="true">{dot.initial}</span>
                <span className="sr-only">
                  {dot.day}: {dot.won ? 'trigger-free' : 'not trigger-free'}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </header>
  );
}

/**
 * Holds the block's place until the device clock is read, so the sores
 * below do not jump when it arrives. It draws the block it expects, in the
 * same markup but invisible, because the moods differ in height by about
 * 130px: the proud one carries a streak card and the week dots. `mood` is
 * the server's guess (`expectedMood`) and `answer` is the neutral copy,
 * which is known before the clock is. Nothing moves or fades, so there is
 * no motion to reduce.
 */
export function StreakBlockPlaceholder({
  mood,
  answer
}: {
  mood: Mood;
  answer: Answer;
}) {
  const headline = mood === 'neutral' ? answer.headline : 'Rough one today.';
  const line =
    mood === 'neutral' ? answer.note : 'Logged. That’s the hard part done.';
  return (
    <header
      aria-hidden="true"
      className="invisible flex flex-col items-center text-center lg:col-span-2"
    >
      <time className="text-sm">Wednesday, September 30</time>
      <div className="-my-1 size-44" />
      <h1 className="text-balance text-2xl leading-tight lg:text-3xl">
        {headline}
      </h1>
      {line && <p className="prose-measure mt-1.5">{line}</p>}
      {mood === 'proud' && (
        <>
          <div className="mt-4 flex w-full max-w-sm items-center justify-center gap-3 px-4 py-3">
            <span className="font-display text-4xl font-extrabold leading-none">
              0
            </span>
            <span className="font-bold">days</span>
          </div>
          <div className="mt-5 h-8 w-full max-w-sm" />
        </>
      )}
    </header>
  );
}
