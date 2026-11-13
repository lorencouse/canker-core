'use client';

import Link from 'next/link';
import { Pill } from 'lucide-react';

import Instrument from '@/components/insights/Instrument';
import { triggerMeta } from '@/components/insights/triggers';
import { Button } from '@/components/ui/button';
import type { DayLog, Sore } from '@/types';
import { treatmentDays, triggersBeforeSores, type Tally } from '@/utils/insights';

/**
 * What was logged in the three days before each sore appeared, and what has
 * been tried. Counts, not percentages: with five sores a percentage would
 * dress up a coincidence as a finding. The method lives behind the "i".
 */
export default function TriggerTally({ sores, logs }: { sores: Sore[]; logs: DayLog[] }) {
  const { tally, soresWithLogs } = triggersBeforeSores(sores, logs);
  const treatments = treatmentDays(logs);

  return (
    <Instrument
      title="Before a sore"
      info={
        <>
          <p>
            Each trigger you logged in the 3 days before a sore counts once for
            that sore. {soresWithLogs} of {sores.length} sores have logs from
            those days.
          </p>
          <p>A repeat is worth a closer look. It is a pattern, not a verdict.</p>
        </>
      }
    >
      {logs.length === 0 ? (
        <div>
          <p className="text-muted-foreground">No logs yet.</p>
          <Button asChild variant="outline" size="touch" className="mt-3">
            <Link href="/today?checkin=1">Check in</Link>
          </Button>
        </div>
      ) : tally.length === 0 ? (
        <p className="text-muted-foreground">
          {soresWithLogs === 0 ? 'No logs before a sore yet.' : 'No triggers before a sore.'}
        </p>
      ) : (
        <ol className="space-y-3">
          {tally.slice(0, 5).map((item) => (
            <TriggerRow key={item.label} item={item} of={soresWithLogs} />
          ))}
        </ol>
      )}

      {treatments.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold">Tried</h3>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {treatments.slice(0, 6).map((t) => (
              <li
                key={t.label}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
              >
                <Pill aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
                <span className="min-w-0 truncate">{t.label}</span>
                <span className="tabular text-muted-foreground">
                  {t.count}
                  <span aria-hidden="true">d</span>
                  <span className="sr-only"> days</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Instrument>
  );
}

function TriggerRow({ item, of }: { item: Tally; of: number }) {
  const { icon: Icon } = triggerMeta(item.label);
  // A legacy row can count a sore without logs; never draw past full.
  const share = of > 0 ? Math.min(1, item.count / of) : 0;
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3">
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-cell bg-secondary text-primary"
      >
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <span className="block truncate text-sm">{item.label}</span>
        {/* Magnitude in one hue; the count beside it carries the number. */}
        <div className="mt-1 h-2 rounded-full bg-muted" aria-hidden="true">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${share * 100}%` }}
          />
        </div>
      </div>
      <span className="tabular text-sm font-semibold">
        <span className="sr-only">
          {item.count} of {of} sores
        </span>
        <span aria-hidden="true">
          {item.count}/{of}
        </span>
      </span>
    </li>
  );
}
