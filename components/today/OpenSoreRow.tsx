'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import SoreThumb from '@/components/sore/SoreThumb';
import type { Sore } from '@/types';
import { LONG_SORE_DAYS } from '@/utils/insights';
import { currentPain, currentSize, dayNumberOf } from '@/utils/readings';
import { sevFill } from '@/utils/severity';

/** Readings the sparkline draws: about a week, the part that says "better or worse". */
const SPARK_READINGS = 7;

/**
 * One open sore on Today, compact: where it is (the mouth map itself,
 * small), how old and how wide, and its last week of pain as a tiny bar line in the severity ramp.
 * The whole row goes to the sore on the map, where its course lives.
 */
export default function OpenSoreRow({
  sore,
  now
}: {
  sore: Sore;
  /** Null until the device clock is read; the day count waits for it. */
  now: Date | null;
}) {
  const day = now ? dayNumberOf(sore, now) : null;
  const pain = currentPain(sore);
  return (
    <Link
      href={`/my-sores?sore=${encodeURIComponent(sore.id)}`}
      className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-cell px-1 py-2 transition-transform hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <SoreThumb sore={sore} />
      <span className="min-w-0">
        <span className="block truncate font-semibold">{sore.zone}</span>
        <span className="tabular block truncate text-sm text-muted-foreground">
          {day !== null && `Day ${day} · `}
          {currentSize(sore)} mm
          <span className="sr-only">, pain {pain} of 10</span>
        </span>
        {day !== null && day > LONG_SORE_DAYS && (
          <span className="block truncate text-sm font-semibold">
            Worth a dentist’s look
          </span>
        )}
      </span>
      <PainSparkline sore={sore} />
      <ChevronRight
        aria-hidden="true"
        className="size-5 text-muted-foreground"
      />
    </Link>
  );
}

/**
 * The last week of readings as bars: height and colour both for pain, so
 * it reads in either. Data, so it wears the severity ramp and nothing else.
 */
function PainSparkline({ sore }: { sore: Sore }) {
  const readings = sore.readings.slice(-SPARK_READINGS);
  const W = 5;
  const GAP = 2;
  const H = 24;
  return (
    <svg
      viewBox={`0 0 ${SPARK_READINGS * (W + GAP) - GAP} ${H}`}
      width={SPARK_READINGS * (W + GAP) - GAP}
      height={H}
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {readings.map((r, i) => {
        // Never shorter than a dot, so pain 1 still shows it was logged.
        const h = Math.max(4, (r.pain / 10) * H);
        // Right-aligned: the newest reading is always the last bar.
        const x = (SPARK_READINGS - readings.length + i) * (W + GAP);
        return (
          <rect
            key={r.id}
            x={x}
            y={H - h}
            width={W}
            height={h}
            rx={2}
            fill={sevFill(r.pain)}
          />
        );
      })}
    </svg>
  );
}
