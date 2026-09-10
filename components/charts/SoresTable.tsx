import React from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Sore } from '@/types';
import { latestReading } from '@/utils/readings';

/**
 * Every sore on record.
 *
 * Two presentations of the same rows, not a table that scrolls sideways.
 * Five columns cannot be read at 390px, and a horizontally scrolling table
 * inside a vertically scrolling app is a gesture conflict as well as a
 * legibility one — so below `sm` each sore becomes a card instead.
 */

const dateOf = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString() : '—';

function PainDot({ pain }: { pain: number }) {
  return (
    <span
      className="size-2.5 shrink-0 rounded-full ring-1 ring-foreground/20"
      style={{ backgroundColor: `hsl(var(--sev-${pain}))` }}
      aria-hidden="true"
    />
  );
}

const SoresTable = ({ sores }: { sores: Sore[] }) => {
  if (!sores.length) return null;

  return (
    <>
      {/* Phone: one card per sore. */}
      <ul className="space-y-2 sm:hidden">
        {sores.map((sore) => {
          const last = latestReading(sore);
          const size = last?.size ?? null;
          const pain = last?.pain ?? null;

          return (
            <li key={sore.id} className="rounded-lg border border-border p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{sore.zone}</span>
                <span className="tabular text-xs text-muted-foreground">
                  {dateOf(sore.created_at)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="tabular">
                  {size === null ? '—' : `${size} mm`}
                </span>
                <span className="tabular inline-flex items-center gap-1.5">
                  {pain !== null && <PainDot pain={pain} />}
                  {pain === null ? '—' : `${pain}/10`}
                </span>
                <span className="ml-auto text-muted-foreground">
                  {sore.healed_at
                    ? `Healed ${new Date(sore.healed_at).toLocaleDateString()}`
                    : 'Open'}
                </span>
              </div>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {sores.map((sore) => {
              const last = latestReading(sore);
              const size = last?.size ?? null;
              const pain = last?.pain ?? null;

              return (
                <TableRow key={sore.id}>
                  <TableCell>{dateOf(sore.created_at)}</TableCell>
                  <TableCell>
                    {sore.healed_at ? (
                      <span className="text-muted-foreground">
                        Healed {new Date(sore.healed_at).toLocaleDateString()}
                      </span>
                    ) : (
                      'Open'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {size === null ? '—' : `${size} mm`}
                  </TableCell>
                  <TableCell className="text-right">
                    {pain === null ? (
                      '—'
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <PainDot pain={pain} />
                        {pain}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{sore.zone}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default SoresTable;
