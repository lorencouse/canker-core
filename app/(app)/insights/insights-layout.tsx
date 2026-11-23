import React from 'react';
import Link from 'next/link';

import InsightsBody from '@/components/insights/InsightsBody';
import Kanko from '@/components/kanko/Kanko';
import LargeTitle from '@/components/shell/LargeTitle';
import { Button } from '@/components/ui/button';
import type { DayLog, Sore } from '@/types';

/**
 * Insights: the finding first, then the figures, the chart, the triggers
 * and every sore (InsightsBody, which owns the range switch and so lays
 * out the title row).
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
      {sores.length === 0 ? (
        <>
          <LargeTitle className="mb-4 lg:mb-6">Insights</LargeTitle>
          <div className="surface-worksheet flex flex-col items-center px-4 py-14 text-center">
            <Kanko mood="curious" size={120} transparent />
            <h2 className="mt-2 text-subhead">No history yet</h2>
            <Button asChild size="touch" className="mt-6 w-full sm:w-auto">
              <Link href="/my-sores?add">Mark a sore</Link>
            </Button>
          </div>
        </>
      ) : (
        <InsightsBody
          sores={sores}
          dayLogs={dayLogs}
          // The body puts the range switch beside it.
          title={
            <LargeTitle
              below={`${sores.length} sore${sores.length === 1 ? '' : 's'} · ${active} open`}
            >
              Insights
            </LargeTitle>
          }
        />
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        A log, not medical advice. A sore that is not shrinking after two weeks
        is worth showing a doctor or dentist.
      </p>
    </div>
  );
};

export default InsightsLayout;
