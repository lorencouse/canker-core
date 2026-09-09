import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useSoreContext } from '@/context/SoreContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SoreSliders from './mouth-map/SoreSliders';

/** Last entry of a reading series, which is the current value. */
const latest = (series: number[] | null | undefined) =>
  series && series.length ? series[series.length - 1] : null;

function Reading({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="tabular mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

const SoreDetails: React.FC = () => {
  const { selectedSore, setSelectedSore, sores, mode } = useSoreContext();
  const [soreIndex, setSoreIndex] = useState(0);

  useEffect(() => {
    setSoreIndex(sores.findIndex((sore) => sore.id === selectedSore?.id));
  }, [selectedSore, sores]);

  const step = (delta: number) => {
    if (!sores.length) return;
    const next = (soreIndex + delta + sores.length) % sores.length;
    setSelectedSore(sores[next]);
  };

  const size = latest(selectedSore?.size);
  const pain = latest(selectedSore?.pain);
  const dates = selectedSore?.dates ?? [];

  const firstSeen = dates.length ? new Date(dates[0]) : null;
  const lastUpdated = dates.length ? new Date(dates[dates.length - 1]) : null;

  // Day 1 is the day it was first marked, matching how people count a sore.
  const dayNumber = useMemo(() => {
    if (!firstSeen) return null;
    const ms = Date.now() - firstSeen.getTime();
    return Math.max(1, Math.floor(ms / 86_400_000) + 1);
  }, [firstSeen]);

  if (!selectedSore) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-medium">No sore selected</p>
          <p className="prose-measure mx-auto mt-1 text-sm text-muted-foreground">
            Tap a sore on the map to see its readings, or use Add to mark a new
            one.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {mode !== 'view' && <SoreSliders />}

      <Card>
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => step(-1)}
            disabled={sores.length < 2}
            aria-label="Previous sore"
          >
            <ChevronLeft />
          </Button>
          <div className="text-center">
            <p className="font-display font-semibold">
              Sore {soreIndex + 1}
              <span className="font-normal text-muted-foreground">
                {' '}
                of {sores.length}
              </span>
            </p>
            {dayNumber !== null && (
              <p className="tabular text-xs text-muted-foreground">
                Day {dayNumber}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => step(1)}
            disabled={sores.length < 2}
            aria-label="Next sore"
          >
            <ChevronRight />
          </Button>
        </div>

        <CardContent className="pt-6">
          <div className="flex flex-col-reverse items-start gap-6 sm:flex-row sm:justify-between">
            <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4">
              <Reading
                label="Size"
                value={size === null ? '—' : `${size} mm`}
              />
              <Reading
                label="Pain"
                value={pain === null ? '—' : `${pain} of 10`}
              />
              <Reading
                label="Location"
                value={selectedSore.zone}
              />
              <Reading label="Readings" value={dates.length} />
              <Reading
                label="First marked"
                value={firstSeen ? firstSeen.toLocaleDateString() : '—'}
              />
              <Reading
                label="Last updated"
                value={lastUpdated ? lastUpdated.toLocaleDateString() : '—'}
              />
            </dl>

            {/*
              Sized in CSS millimetres so the swatch really is close to life
              size, which is the point of showing it at all.
            */}
            <div className="flex w-full shrink-0 flex-col items-center gap-2 sm:w-24">
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-border bg-muted/40">
                <span
                  className="rounded-full ring-1 ring-foreground/20"
                  style={{
                    width: `${size ?? 0}mm`,
                    height: `${size ?? 0}mm`,
                    backgroundColor: `hsl(var(--sev-${pain ?? 1}))`
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">Actual size</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { SoreDetails };
