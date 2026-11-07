'use client';

import { useMemo } from 'react';

import StreakBlock from '@/components/today/StreakBlock';
import { Button } from '@/components/ui/button';
import type { DayLog, Sore } from '@/types';
import { answerLine } from '@/utils/course';
import { tap } from '@/utils/native';

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
  const answer = useMemo(() => answerLine(sores, now), [sores, now]);
  return (
    <div className="grid gap-6">
      <div className="text-center">
        <StepHeading>All logged</StepHeading>
      </div>
      <StreakBlock
        sores={sores}
        logs={logs}
        now={now}
        answer={answer}
        celebrate="proud"
      />
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
