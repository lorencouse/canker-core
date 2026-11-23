'use client';

import { useState, type ReactNode } from 'react';
import { Check, Moon, Zap } from 'lucide-react';

import StreakCard from '@/components/today/StreakCard';
import { Button } from '@/components/ui/button';
import type { DayLog, Sore } from '@/types';
import { effectiveTriggers } from '@/utils/day-log';
import { dayKey } from '@/utils/days';
import { isAnswered, todayMood } from '@/utils/momentum';
import { tap } from '@/utils/native';
import { currentPain, currentSize, hasReadingOn } from '@/utils/readings';
import { readReminder, remindersSupported } from '@/utils/reminders';
import { sevFill } from '@/utils/severity';

import { StepFooter } from './StepLayout';
import StepHeading from './StepHeading';

/**
 * The end of the check-in, and its peak: what was logged, the streak as it
 * stands with these answers in it, and when we meet again. Reaching here is
 * what records the day as checked in.
 *
 * Its mood follows the day, as the Momentum spec asks. On a good day Kanko
 * celebrates; on a bad one (a new sore, or pain of 6 or more) there is no
 * confetti and no figure, only gentle Kanko and a quiet line, because
 * logging a rough day was the hard part.
 */
export default function FinishStep({
  sores,
  logs,
  now,
  onDone
}: {
  sores: Sore[];
  logs: DayLog[];
  now: Date;
  onDone: () => void;
}) {
  const gentle = todayMood(sores, logs, now) === 'gentle';
  const logged = sores.filter((s) => !s.healed_at && hasReadingOn(s, now));
  const log = logs.find((l) => l.day === dayKey(now));
  const [reminder] = useState(nextReminderLabel);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="text-center">
        <StepHeading>{gentle ? 'Logged.' : 'All logged.'}</StepHeading>
      </div>
      <StreakCard
        sores={sores}
        logs={logs}
        now={now}
        celebrate={gentle ? undefined : 'done'}
      />
      <Summary sores={logged} log={log} />
      <p className="text-pretty text-center text-muted-foreground">
        {gentle
          ? 'Rest up. I’ll check in with you tomorrow.'
          : reminder
            ? `See you tomorrow. Your reminder is at ${reminder}.`
            : 'See you tomorrow.'}
      </p>
      <div aria-hidden="true" className="flex-1" />
      <StepFooter>
        <Button
          type="button"
          size="touch"
          className="w-full"
          onClick={() => {
            tap();
            onDone();
          }}
        >
          Done
        </Button>
      </StepFooter>
    </div>
  );
}

/**
 * What this check-in wrote, one row each: today's readings in their pain
 * colours, then the day's triggers and last night's sleep when they were
 * answered for today.
 */
function Summary({ sores, log }: { sores: Sore[]; log: DayLog | undefined }) {
  const triggers = log && isAnswered(log) ? effectiveTriggers(log) : null;
  const sleep = log ? sleepText(log) : null;
  if (sores.length === 0 && triggers === null && sleep === null) return null;
  return (
    <ul
      aria-label="What you logged today"
      className="surface-worksheet px-4 py-1"
    >
      {sores.map((s) => (
        <Row
          key={s.id}
          icon={
            <span
              className="size-3.5 rounded-full"
              style={{ backgroundColor: sevFill(currentPain(s)) }}
            />
          }
          label={s.zone}
          value={`${currentSize(s)} mm · pain ${currentPain(s)}`}
        />
      ))}
      {triggers !== null && (
        <Row
          icon={
            triggers.length === 0 ? (
              <Check className="size-4 text-win" strokeWidth={3} />
            ) : (
              <Zap className="size-4 text-comfort" />
            )
          }
          label="Triggers"
          value={triggers.length === 0 ? 'None' : triggers.join(', ')}
        />
      )}
      {sleep !== null && (
        <Row
          icon={<Moon className="size-4 text-primary" />}
          label="Last night"
          value={sleep}
        />
      )}
    </ul>
  );
}

function Row({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <li className="grid min-h-12 grid-cols-[1rem_auto_minmax(0,1fr)] items-center gap-3 border-t border-border py-2.5 first:border-t-0">
      <span aria-hidden="true" className="grid place-items-center">
        {icon}
      </span>
      <span className="whitespace-nowrap text-muted-foreground">{label}</span>
      <span className="tabular truncate text-right font-semibold">{value}</span>
    </li>
  );
}

const QUALITY_WORDS: Record<number, string> = {
  1: 'slept badly',
  2: 'slept poorly',
  3: 'slept okay',
  4: 'slept well',
  5: 'slept very well'
};

function sleepText(log: DayLog): string | null {
  const hours =
    log.sleep_hours === null || log.sleep_hours === undefined
      ? null
      : `${Number(log.sleep_hours)} h`;
  const quality =
    log.sleep_quality === null ? null : QUALITY_WORDS[log.sleep_quality];
  const parts = [hours, quality].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/**
 * Tomorrow's first reminder on this phone, as "8:00 am", or null when none
 * is on. Reminders are per device and app-only, and tonight's evening nudge
 * is skipped once the day is checked in, so the morning one comes first.
 */
function nextReminderLabel(): string | null {
  if (!remindersSupported()) return null;
  const pref = [readReminder('morning'), readReminder('evening')].find(
    (p) => p.enabled
  );
  if (!pref) return null;
  const [h, m] = pref.time.split(':').map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
