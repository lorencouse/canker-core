import Link from 'next/link';

import Instrument from '@/components/insights/Instrument';
import { Button } from '@/components/ui/button';
import type { DayLog, Sore } from '@/types';
import { treatmentDays, triggersBeforeSores, type Tally } from '@/utils/insights';

/**
 * What was logged in the three days before each sore appeared, and what has
 * been tried. Counts, not percentages: with five sores a percentage would
 * dress up a coincidence as a finding.
 */
export default function TriggerTally({ sores, logs }: { sores: Sore[]; logs: DayLog[] }) {
  const { tally, soresWithLogs } = triggersBeforeSores(sores, logs);
  const treatments = treatmentDays(logs);

  if (logs.length === 0) {
    return (
      <Instrument
        title="Patterns"
        caption="Log what you ate, how you slept and what you tried on the Today tab, and this is where the repeat offenders show up."
      >
        <Button asChild variant="outline" size="touch" className="w-full sm:w-auto">
          <Link href="/today">Log today</Link>
        </Button>
      </Instrument>
    );
  }

  return (
    <Instrument
      title="Patterns"
      caption={`Over ${logs.length} logged day${logs.length === 1 ? '' : 's'}. A trigger that keeps appearing in the run-up to a sore is worth a closer look; it is a pattern, not a verdict.`}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <TallyList
          heading="In the 3 days before a sore"
          items={tally}
          unit={(n) => `${n} of ${soresWithLogs}`}
          empty={
            soresWithLogs === 0
              ? 'No logs yet from the days before a sore appeared.'
              : 'Nothing logged as a trigger in those days.'
          }
        />
        <TallyList
          heading="What you have tried"
          items={treatments}
          unit={(n) => `${n} day${n === 1 ? '' : 's'}`}
          empty="No treatments logged yet."
        />
      </div>
    </Instrument>
  );
}

function TallyList({
  heading,
  items,
  unit,
  empty
}: {
  heading: string;
  items: Tally[];
  unit: (count: number) => string;
  empty: string;
}) {
  const max = items[0]?.count ?? 0;
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{heading}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ol className="space-y-2">
          {items.slice(0, 6).map((item) => (
            <li key={item.label} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span>{item.label}</span>
                <span className="tabular text-muted-foreground">{unit(item.count)}</span>
              </div>
              {/* A quiet bar in the accent tone: magnitude, one hue. */}
              <div className="mt-1 h-1.5 rounded-full bg-muted" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
