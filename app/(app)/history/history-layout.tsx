import React from 'react';
import Link from 'next/link';

import BarChartComponent from '@/components/charts/BarChartComponent';
import SoresTable from '@/components/charts/SoresTable';
import Instrument from '@/components/insights/Instrument';
import StatTiles from '@/components/insights/StatTiles';
import TriggerTally from '@/components/insights/TriggerTally';
import { Button } from '@/components/ui/button';
import type { DayLog, Sore, User } from '@/types';

/**
 * History: the headline figures, the chart, the patterns, and every sore.
 *
 * Stacked at every width below xl. The chart and the table are the same
 * data at two levels of detail, and reading one against the other means
 * scrolling between them rather than sitting them side by side in 400px
 * columns where neither is legible.
 */
const SoreHistoryLayout = ({
  sores,
  dayLogs
}: {
  user: User;
  sores: Sore[];
  dayLogs: DayLog[];
}) => {
  const active = sores.filter((sore) => !sore.healed_at).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 lg:px-6 lg:py-8">
      <header className="mb-4 lg:mb-6">
        {/* The top bar already names the screen on a phone; this heading is
            the desktop one, where the bar carries the wordmark instead. */}
        <h1 className="hidden text-title lg:block">History</h1>
        <p className="prose-measure text-muted-foreground lg:mt-2">
          {sores.length === 0
            ? 'Nothing logged yet.'
            : `${sores.length} sore${sores.length === 1 ? '' : 's'} on record, ${active} still open.`}
        </p>
      </header>

      {sores.length === 0 ? (
        <div className="surface-worksheet flex flex-col items-center px-4 py-14 text-center">
          <h2 className="text-subhead">Your history starts with one mark</h2>
          <p className="prose-measure mt-2 text-muted-foreground">
            Once you log a sore on the mouth map, its size and pain over time
            show up here.
          </p>
          <Button asChild size="touch" className="mt-6 w-full sm:w-auto">
            <Link href="/my-sores">Open the mouth map</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4 xl:space-y-8">
          <StatTiles sores={sores} />
          <div className="grid gap-4 xl:grid-cols-2 xl:gap-8">
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

export default SoreHistoryLayout;
