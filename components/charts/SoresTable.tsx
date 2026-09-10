'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import CourseStrip from '@/components/sore/CourseStrip';
import SoreSigil from '@/components/sore/SoreSigil';
import type { Sore } from '@/types';
import { cn } from '@/utils/cn';
import { dayNumberOf, latestReading } from '@/utils/readings';

import SoreHistoryChart from './SoreHistoryChart';

/**
 * Every sore on record, each opening into its own course.
 *
 * Two presentations of the same rows, not a table that scrolls sideways.
 * Five columns cannot be read at 390px, and a horizontally scrolling table
 * inside a vertically scrolling app is a gesture conflict as well as a
 * legibility one — so below `sm` each sore becomes a card instead.
 *
 * Tapping a row expands it in place rather than navigating away: the point
 * of a history is comparing one sore against the next, and a detail page
 * would put a back button between every comparison.
 */

const dateOf = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : '—');

function PainDot({ pain }: { pain: number }) {
  return (
    <span
      className="size-2.5 shrink-0 rounded-full ring-1 ring-foreground/20"
      style={{ backgroundColor: `hsl(var(--sev-${pain}))` }}
      aria-hidden="true"
    />
  );
}

function SoreDetail({ sore }: { sore: Sore }) {
  const notes = sore.readings.filter((r) => r.note);
  return (
    <div className="space-y-3">
      <SoreHistoryChart sore={sore} />
      {notes.length > 0 && (
        <ul className="space-y-1 text-sm">
          {notes.map((r) => (
            <li key={r.id} className="flex gap-3">
              <span className="tabular shrink-0 text-muted-foreground">{dateOf(r.recorded_at)}</span>
              <span data-selectable>{r.note}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="tabular">
          First marked {dateOf(sore.created_at)}. {sore.readings.length} reading
          {sore.readings.length === 1 ? '' : 's'} over{' '}
          {sore.healed_at
            ? `${dayNumberOf(sore)} day${dayNumberOf(sore) === 1 ? '' : 's'}, then healed`
            : `${dayNumberOf(sore)} day${dayNumberOf(sore) === 1 ? '' : 's'} so far`}
          .
        </span>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/my-sores?sore=${sore.id}`}>
            <MapPin aria-hidden="true" />
            Show on map
          </Link>
        </Button>
      </div>
    </div>
  );
}

const SoresTable = ({ sores }: { sores: Sore[] }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  if (!sores.length) return null;

  return (
    <>
      {/* Phone: one card per sore. */}
      {/* Rows, not a stack of little cards: they sit on an instrument, and
          bordering each one would be a card inside a card. */}
      <ul className="-my-3 divide-y divide-border sm:hidden">
        {sores.map((sore) => {
          const last = latestReading(sore);
          const expanded = openId === sore.id;
          return (
            <li key={sore.id}>
              <button
                type="button"
                className="w-full py-3 text-left"
                aria-expanded={expanded}
                onClick={() => toggle(sore.id)}
              >
                <div className="flex items-center gap-3">
                  <SoreSigil sore={sore} size={30} />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{sore.zone}</span>
                    <span className="tabular text-xs text-muted-foreground">
                      {sore.healed_at
                        ? `Healed ${dateOf(sore.healed_at)}`
                        : `Open, day ${dayNumberOf(sore)}`}
                    </span>
                  </div>
                  <span className="tabular text-sm">{last ? `${last.size} mm` : '—'}</span>
                  <span className="tabular inline-flex items-center gap-1.5 text-sm">
                    {last && <PainDot pain={last.pain} />}
                    {last ? `${last.pain}/10` : '—'}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn('size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
                  />
                </div>
                <CourseStrip sore={sore} className="mt-2.5" />
              </button>
              {expanded && (
                <div className="pb-3">
                  <SoreDetail sore={sore} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Tablet and up: the full table. */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sore</TableHead>
              {/* The strip carries how long, how consistently it was logged
                  and how the pain moved, which is what three date and status
                  columns were doing between them. The exact dates are in the
                  expanded row. */}
              <TableHead>Course</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead className="text-right">Pain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Details</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sores.map((sore) => {
              const last = latestReading(sore);
              const expanded = openId === sore.id;
              return (
                <Fragment key={sore.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => toggle(sore.id)}
                    aria-expanded={expanded}
                  >
                    <TableCell>
                      <span className="flex items-center gap-2.5">
                        <SoreSigil sore={sore} size={26} />
                        <span className="font-medium">{sore.zone}</span>
                      </span>
                    </TableCell>
                    {/* Fixed width so a long course wraps into a block of
                        rows instead of stretching the column. */}
                    <TableCell className="w-40">
                      <CourseStrip sore={sore} />
                    </TableCell>
                    <TableCell className="text-right">{last ? `${last.size} mm` : '—'}</TableCell>
                    <TableCell className="text-right">
                      {last ? (
                        <span className="inline-flex items-center gap-2">
                          <PainDot pain={last.pain} />
                          {last.pain}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="tabular">
                      {sore.healed_at ? (
                        <span className="text-muted-foreground">Healed {dateOf(sore.healed_at)}</span>
                      ) : (
                        `Open, day ${dayNumberOf(sore)}`
                      )}
                    </TableCell>
                    <TableCell>
                      <ChevronDown
                        aria-hidden="true"
                        className={cn('size-4 text-muted-foreground transition-transform', expanded && 'rotate-180')}
                      />
                    </TableCell>
                  </TableRow>
                  {expanded && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="bg-muted/30">
                        <SoreDetail sore={sore} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default SoresTable;
