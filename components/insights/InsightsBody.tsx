'use client';

import { useMemo, useState } from 'react';

import SoresTable from '@/components/charts/SoresTable';
import FindingCard from '@/components/insights/FindingCard';
import Instrument from '@/components/insights/Instrument';
import SizeChart from '@/components/insights/SizeChart';
import StatTiles from '@/components/insights/StatTiles';
import TriggerTally from '@/components/insights/TriggerTally';
import { Button } from '@/components/ui/button';
import type { DayLog, Sore } from '@/types';
import { cn } from '@/utils/cn';
import { addDays } from '@/utils/days';
import { soreDays, soresActiveSince, strongestPattern } from '@/utils/insights';

type Range = '30d' | 'all';

/** Rows of "Every sore" shown before "Show all". */
const LIST_PREVIEW = 5;

/**
 * Everything under the Insights title, for a user with at least one sore:
 * the finding, the figures, the chart, the triggers and every sore, all
 * read over one range. The range is a client switch over data the page
 * already has, so changing it costs no request.
 */
export default function InsightsBody({ sores, dayLogs }: { sores: Sore[]; dayLogs: DayLog[] }) {
  const since30 = useMemo(() => addDays(new Date(), -29), []);
  // The switch only earns its place when there is history older than 30 days.
  const hasOlder = sores.some((s) => new Date(s.created_at) < since30);
  const [range, setRange] = useState<Range>(() =>
    soresActiveSince(sores, since30).length > 0 ? '30d' : 'all'
  );
  const since = hasOlder && range === '30d' ? since30 : null;

  // Triggers are read for sores that started in the range.
  const started = since ? sores.filter((s) => new Date(s.created_at) >= since) : sores;
  const finding = strongestPattern(started, dayLogs);
  const days = useMemo(() => soreDays(sores, since), [sores, since]);

  const [showAll, setShowAll] = useState(false);
  const listed = showAll ? sores : sores.slice(0, LIST_PREVIEW);

  return (
    <div className="space-y-4">
      {hasOlder && (
        <div className="flex justify-end">
          <RangeSwitch value={range} onChange={setRange} />
        </div>
      )}
      {/*
        On a spanned Duo: the finding, the figures and the list on the first
        screen, the chart and the triggers down the second (THE FOLD in
        styles/main.css).
      */}
      <div className="fold-split space-y-4 fold:grid-rows-[auto_auto_1fr] fold:items-start fold:gap-y-4 fold:space-y-0 xl:space-y-6">
        <FindingCard finding={finding} />
        <StatTiles sores={sores} since={since} />
        <div className="fold-end grid grid-cols-1 gap-4 fold:row-span-3 fold:row-start-1 xl:grid-cols-2 xl:gap-6">
          <SizeChart sores={sores} days={days} />
          <TriggerTally sores={started} logs={dayLogs} />
        </div>
        <Instrument title="Every sore">
          <SoresTable sores={listed} />
          {sores.length > LIST_PREVIEW && (
            <Button
              variant="ghost"
              className="mt-2 w-full"
              aria-expanded={showAll}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? 'Show fewer' : `Show all ${sores.length}`}
            </Button>
          )}
        </Instrument>
      </div>
    </div>
  );
}

/** A compact two-way switch, iOS style: the chosen side is a raised thumb. */
function RangeSwitch({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const options: { id: Range; label: string; name: string }[] = [
    { id: '30d', label: '30d', name: 'Last 30 days' },
    { id: 'all', label: 'All', name: 'All time' }
  ];
  return (
    <div role="group" aria-label="Range" className="inline-flex rounded-full bg-secondary p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          aria-label={o.name}
          onClick={() => onChange(o.id)}
          className={cn(
            'focus-ring tap-target h-9 min-w-16 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors coarse:h-11',
            value === o.id
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
