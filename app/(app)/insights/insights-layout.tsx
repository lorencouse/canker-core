import React from 'react';
import Link from 'next/link';

import BarChartComponent from '@/components/charts/BarChartComponent';
import SoresTable from '@/components/charts/SoresTable';
import Instrument from '@/components/insights/Instrument';
import StatTiles from '@/components/insights/StatTiles';
import TriggerTally from '@/components/insights/TriggerTally';
import Kanko from '@/components/kanko/Kanko';
import LargeTitle from '@/components/shell/LargeTitle';
import { Button } from '@/components/ui/button';
import type { DayLog, Sore } from '@/types';

/**
 * Insights: the headline figures, the chart, the patterns, and every sore.
 *
 * Stacked at every width below xl. The chart and the table are the same
 * data at two levels of detail, and reading one against the other means
 * scrolling between them rather than sitting them side by side in 400px
 * columns where neither is legible.
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
        <div className="surface-worksheet flex flex-col items-center px-4 py-14 text-center">
          <Kanko mood="curious" size={120} />
          <h2 className="mt-2 text-subhead">No history yet</h2>
          <Button asChild size="touch" className="mt-6 w-full sm:w-auto">
            <Link href="/my-sores?add">Mark a sore</Link>
          </Button>
        </div>
      ) : (
        /*
          On a spanned Duo: the tiles and the table on the first screen, the
          two charts down the second (THE FOLD in styles/main.css).
        */
        <div className="fold-split space-y-4 fold:grid-rows-[auto_1fr] fold:items-start fold:gap-y-4 fold:space-y-0 xl:space-y-8">
          <StatTiles sores={sores} />
          <div className="fold-end grid grid-cols-1 gap-4 fold:row-span-2 fold:row-start-1 xl:grid-cols-2 xl:gap-8">
            <BarChartComponent sores={sores} />
            <TriggerTally sores={sores} logs={dayLogs} />
          </div>
          <Instrument title="Every sore">
            <SoresTable sores={sores} />
          </Instrument>
        </div>
      )}
    </div>
  );
};

export default InsightsLayout;
