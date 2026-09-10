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
          {sore.readings.length} reading{sore.readings.length === 1 ? '' : 's'} ·{' '}
          {sore.healed_at
            ? `healed after ${dayNumberOf(sore)} day${dayNumberOf(sore) === 1 ? '' : 's'}`
            : `day ${dayNumberOf(sore)}`}
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
      <ul className="space-y-2 sm:hidden">
        {sores.map((sore) => {
          const last = latestReading(sore);
          const expanded = openId === sore.id;
          return (
            <li key={sore.id} className="rounded-lg border border-border">
              <button
                type="button"
                className="w-full p-3 text-left"
                aria-expanded={expanded}
                onClick={() => toggle(sore.id)}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{sore.zone}</span>
                  <span className="tabular text-xs text-muted-foreground">{dateOf(sore.created_at)}</span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="tabular">{last ? `${last.size} mm` : '—'}</span>
                  <span className="tabular inline-flex items-center gap-1.5">
                    {last && <PainDot pain={last.pain} />}
                    {last ? `${last.pain}/10` : '—'}
                  </span>
                  <span className="ml-auto text-muted-foreground">
                    {sore.healed_at ? `Healed ${dateOf(sore.healed_at)}` : 'Open'}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn('size-4 text-muted-foreground transition-transform', expanded && 'rotate-180')}
                  />
                </div>
              </button>
              {expanded && (
                <div className="border-t border-border p-3">
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
              <TableHead>First marked</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead className="text-right">Pain</TableHead>
              <TableHead>Location</TableHead>
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
                    <TableCell>{dateOf(sore.created_at)}</TableCell>
                    <TableCell>
                      {sore.healed_at ? (
                        <span className="text-muted-foreground">Healed {dateOf(sore.healed_at)}</span>
                      ) : (
                        'Open'
                      )}
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
                    <TableCell>{sore.zone}</TableCell>
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
