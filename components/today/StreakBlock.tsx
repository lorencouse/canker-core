import Kanko from '@/components/kanko/Kanko';
import type { DayLog, Sore } from '@/types';
import type { Answer } from '@/utils/course';
import {
  streakHeadline,
  todayMood,
  triggerFreeStreak,
  weekDots
} from '@/utils/momentum';
import { dayKey } from '@/utils/readings';

/**
 * The top of Today: Kanko, the day's headline and, on a trigger-free run,
 * the streak. It reads only saved data, so dragging a slider never changes
 * the mood; the caller passes what has been written, not what is being edited.
 */
export default function StreakBlock({
  sores,
  logs,
  now,
  answer
}: {
  sores: Sore[];
  logs: DayLog[];
  now: Date;
  answer: Answer;
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
      <Kanko mood={mood} size={176} priority className="-my-1 size-44" />
      <h1 className="text-balance text-2xl leading-tight lg:text-3xl">
        {headline}
      </h1>
      {line && <p className="prose-measure mt-1.5">{line}</p>}

      {mood === 'proud' && (
        <>
          <div className="mt-4 flex w-full max-w-sm items-center justify-center gap-3 rounded-worksheet bg-primary px-4 py-3 text-primary-foreground shadow-press">
            <span className="tabular whitespace-nowrap font-display text-4xl font-extrabold leading-none text-win">
              {streak}
            </span>
            <span className="font-bold">trigger-free days</span>
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
                    ? 'grid size-8 place-items-center rounded-full bg-win text-xs font-extrabold text-foreground shadow-press-win'
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
