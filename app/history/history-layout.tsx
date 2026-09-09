import React from 'react';
import Link from 'next/link';

import BarChartComponent from '@/components/charts/BarChartComponent';
import SoresTable from '@/components/charts/SoresTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Sore } from '@/types';

const SoreHistoryLayout = ({ user, sores }: { user: User; sores: Sore[] }) => {
  const active = sores.filter((sore) => !sore.healed).length;

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="text-title">History</h1>
        <p className="prose-measure mt-2 text-muted-foreground">
          {sores.length === 0
            ? 'Nothing logged yet.'
            : `${sores.length} sore${sores.length === 1 ? '' : 's'} on record, ${active} still open.`}
        </p>
      </header>

      {sores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <h2 className="text-subhead">Your history starts with one mark</h2>
            <p className="prose-measure mt-2 text-muted-foreground">
              Once you log a sore on the mouth map, its size and pain over time
              show up here.
            </p>
            <Button asChild className="mt-6">
              <Link href="/my-sores">Open the mouth map</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 xl:grid-cols-2">
          <BarChartComponent sores={sores} />
          <Card>
            <CardHeader>
              <CardTitle className="text-subhead">Every reading</CardTitle>
            </CardHeader>
            <CardContent>
              <SoresTable sores={sores} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SoreHistoryLayout;
