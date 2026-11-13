'use client';

import StreakCard from '@/components/today/StreakCard';
import { Button } from '@/components/ui/button';
import type { DayLog, Sore } from '@/types';
import { tap } from '@/utils/native';
import { currentPain, currentSize, hasReadingOn } from '@/utils/readings';
import { sevFill } from '@/utils/severity';

import StepHeading from './StepHeading';

/**
 * The end of the check-in: Kanko proud whatever the day held, since
 * logging it was the job, and the streak as it stands with this check-in's
 * answers in it. Reaching here is what records the day as checked in.
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
  const logged = sores.filter((s) => !s.healed_at && hasReadingOn(s, now));
  return (
    <div className="grid gap-6">
      <div className="text-center">
        <StepHeading>All logged</StepHeading>
      </div>
      <StreakCard sores={sores} logs={logs} now={now} celebrate="done" />
      {logged.length > 0 && (
        <ul className="grid gap-1.5" aria-label="Sores logged today">
          {logged.map((s) => (
            <li
              key={s.id}
              className="grid grid-cols-[0.875rem_minmax(0,1fr)_auto] items-center gap-3 rounded-cell border-2 border-border bg-card px-3 py-2.5 text-sm font-semibold"
            >
              <span
                aria-hidden="true"
                className="size-3.5 rounded-full"
                style={{ backgroundColor: sevFill(currentPain(s)) }}
              />
              <span className="truncate">{s.zone}</span>
              <span className="tabular whitespace-nowrap text-muted-foreground">
                {currentSize(s)} mm · pain {currentPain(s)}
              </span>
            </li>
          ))}
        </ul>
      )}
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
    </div>
  );
}
