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

const latest = (series: number[] | null) =>
  series && series.length ? series[series.length - 1] : null;

const SoresTable = ({ sores }: { sores: Sore[] }) => {
  if (!sores.length) return null;

  return (
    <div className="overflow-x-auto">
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
            const size = latest(sore.size);
            const pain = latest(sore.pain);

            return (
              <TableRow key={sore.id}>
                <TableCell>
                  {sore.dates?.length
                    ? new Date(sore.dates[0]).toLocaleDateString()
                    : '—'}
                </TableCell>
                <TableCell>
                  {sore.healed ? (
                    <span className="text-muted-foreground">
                      Healed {new Date(sore.healed).toLocaleDateString()}
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
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-foreground/20"
                        style={{ backgroundColor: `hsl(var(--sev-${pain}))` }}
                      />
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
  );
};

export default SoresTable;
