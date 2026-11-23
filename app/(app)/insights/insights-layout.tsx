import React from 'react';
import Link from 'next/link';

import InsightsBody from '@/components/insights/InsightsBody';
import Kanko from '@/components/kanko/Kanko';
import LargeTitle from '@/components/shell/LargeTitle';
import { Button } from '@/components/ui/button';
import type { DayLog, Sore } from '@/types';

/**
 * Insights: the finding first, then the figures, the chart, the triggers
 * and every sore (InsightsBody, which owns the range switch).
 */
const InsightsLayout = ({
  sores,
  dayLogs
}: {
  sores: Sore[];
  dayLogs: DayLog[];
}) => {
  const active = sores.filter((sore) => !sore.healed_at).length;

  return (
    <div className="fold-shell mx-auto max-w-6xl px-4 py-4 lg:px-6 lg:py-8">
      <LargeTitle
        className="mb-4 lg:mb-6"
        below={
          sores.length === 0
            ? undefined
            : `${sores.length} sore${sores.length === 1 ? '' : 's'} · ${active} open`
        }
      >
        Insights
      </LargeTitle>

      {sores.length === 0 ? (
        <div className="surface-worksheet flex flex-col items-center px-4 py-8 text-center">
          <Kanko mood="curious" size={120} transparent />
          <h2 className="mt-2 text-balance text-subhead">
            Your patterns show up here
          </h2>
          <p className="prose-measure mt-1 max-w-sm text-pretty text-muted-foreground">
            Check in for a week and I’ll show what tends to come before a sore,
            and how fast yours heal.
          </p>
          {/* What a finding looks like, so the promise is concrete. */}
          <div
            aria-hidden="true"
            className="mt-5 w-full max-w-sm rounded-worksheet border-2 border-dashed border-border px-4 py-3.5 text-left"
          >
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-extrabold text-accent-foreground">
              Example
            </span>
            <p className="mt-2 font-bold">Coffee came before 2 of 3 sores</p>
            <p className="text-sm text-muted-foreground">Pattern, not proof</p>
          </div>
          <div className="mt-6 grid w-full gap-3 sm:flex sm:w-auto sm:justify-center">
            <Button asChild size="touch">
              <Link href="/today?checkin=1">Check in today</Link>
            </Button>
            <Button asChild size="touch" variant="outline">
              <Link href="/my-sores?add">Mark a sore</Link>
            </Button>
          </div>
        </div>
      ) : (
        <InsightsBody sores={sores} dayLogs={dayLogs} />
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        A log, not medical advice. A sore that is not shrinking after two weeks
        is worth showing a doctor or dentist.
      </p>
    </div>
  );
};

export default InsightsLayout;
