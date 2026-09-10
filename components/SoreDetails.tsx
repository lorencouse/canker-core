'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useSoreContext } from '@/context/SoreContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Sore } from '@/types';
import { cn } from '@/utils/cn';
import { dayNumberOf, latestReading } from '@/utils/readings';

/**
 * The readings for the selected sore.
 *
 * Split into pieces rather than shipped as one card, because this content
 * appears in two very different frames: a column beside the map on a
 * desktop, and a bottom sheet over the map on a phone. Only the frame
 * differs — the readings themselves are identical, and duplicating them
 * would guarantee the two drift.
 */

/** Day 1 is the day it was first marked, matching how people count a sore. */
function useSoreFacts(sore: Sore | null) {
  return useMemo(() => {
    const last = latestReading(sore);
    return {
      size: last?.size ?? null,
      pain: last?.pain ?? null,
      note: last?.note ?? null,
      readings: sore?.readings.length ?? 0,
      firstSeen: sore ? new Date(sore.created_at) : null,
      lastUpdated: last ? new Date(last.recorded_at) : null,
      healed: sore?.healed_at ? new Date(sore.healed_at) : null,
      dayNumber: sore ? dayNumberOf(sore) : null
    };
  }, [sore]);
}

function Reading({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="tabular mt-0.5 truncate font-medium">{value}</dd>
    </div>
  );
}

/**
 * Prev/next between sores, plus which one you are looking at. Also the
 * sheet's title on a phone, so it carries the day count that identifies the
 * sore more usefully than its index does.
 */
export function SoreNavigator({ className }: { className?: string }) {
  const { selectedSore, setSelectedSore, visibleSores: sores } =
    useSoreContext();
  const [index, setIndex] = useState(0);
  const { dayNumber, healed } = useSoreFacts(selectedSore ?? null);

  useEffect(() => {
    setIndex(sores.findIndex((sore) => sore.id === selectedSore?.id));
  }, [selectedSore, sores]);

  const step = (delta: number) => {
    if (!sores.length) return;
    setSelectedSore(sores[(index + delta + sores.length) % sores.length]);
  };

  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
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
        <p className="font-display text-sm font-semibold">
          Sore {index + 1}
          <span className="font-normal text-muted-foreground">
            {' '}
            of {sores.length}
          </span>
        </p>
        {dayNumber !== null && (
          <p className="tabular text-xs text-muted-foreground">
            {healed ? `Healed after ${dayNumber} day${dayNumber === 1 ? '' : 's'}` : `Day ${dayNumber}`}
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
  );
}

/**
 * The readings themselves.
 *
 * Two columns of figures at every width. Collapsing to one on a phone would
 * push the actual-size swatch below the fold, and comparing size against
 * pain is the whole reason both are on screen at once.
 */
export function SoreReadings() {
  const { selectedSore } = useSoreContext();
  const { size, pain, note, readings, firstSeen, lastUpdated, healed } =
    useSoreFacts(selectedSore);

  if (!selectedSore) return null;

  return (
    <div className="space-y-4">
    <div className="flex items-start gap-5">
      <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-3.5">
        <Reading label="Size" value={size === null ? '—' : `${size} mm`} />
        <Reading label="Pain" value={pain === null ? '—' : `${pain} of 10`} />
        <Reading label="Location" value={selectedSore.zone} />
        <Reading label="Readings" value={readings} />
        <Reading
          label="First marked"
          value={firstSeen ? firstSeen.toLocaleDateString() : '—'}
        />
        {healed ? (
          <Reading label="Healed" value={healed.toLocaleDateString()} />
        ) : (
          <Reading
            label="Last updated"
            value={lastUpdated ? lastUpdated.toLocaleDateString() : '—'}
          />
        )}
      </dl>

      {/*
        Sized in CSS millimetres so the swatch really is close to life size,
        which is the point of showing it at all.
      */}
      <div className="flex w-20 shrink-0 flex-col items-center gap-1.5">
        <div className="flex size-20 items-center justify-center rounded-xl border border-border bg-muted/40">
          <span
            className="rounded-full ring-1 ring-foreground/20"
            style={{
              width: `${size ?? 0}mm`,
              height: `${size ?? 0}mm`,
              backgroundColor: `hsl(var(--sev-${pain ?? 1}))`
            }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground">Actual size</span>
      </div>
    </div>
    {note && (
      <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Latest note: </span>
        {note}
      </p>
    )}
    </div>
  );
}

/** Shown in the desktop column when nothing is selected. */
export function SoreEmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="font-medium">No sore selected</p>
        <p className="prose-measure mx-auto mt-1 text-sm text-muted-foreground">
          Tap a sore on the map to see its readings, or use Add to mark a new
          one.
        </p>
      </CardContent>
    </Card>
  );
}
