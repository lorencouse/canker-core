import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Sore } from '@/types';

const SoresTable = ({ sores }: { sores: Sore[] }) => {
  if (!sores) {
    return <p>No sores found.</p>;
  }

  return (
    <Table>
      <TableHeader className="bg-gray-100 font-bold ">
        <TableRow>
          <TableCell>Created</TableCell>
          <TableCell>Healed</TableCell>
          <TableCell>Pain Levels</TableCell>
          <TableCell>Sizes</TableCell>
          <TableCell>Location</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sores.map((sore) => (
          <TableRow key={sore.id}>
            <TableCell>
              {sore.dates
                ? new Date(sore.dates[0]).toLocaleDateString()
                : 'N/A'}
            </TableCell>
            <TableCell>
              {sore.healed
                ? new Date(sore.healed).toLocaleDateString()
                : 'Active'}
            </TableCell>
            <TableCell>{sore.pain ? sore.pain.join(', ') : ''}</TableCell>
            <TableCell>{sore.size ? sore.size.join(', ') : ''}</TableCell>
            <TableCell>
              {sore.zone} on {sore.gums ? 'gums' : 'mouth'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SoresTable;
