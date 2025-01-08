'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ImagePoint from '@/components/image-plot/ImagePoint';
import { SoreProvider } from '@/context/SoreContext';
import { SoreDetails } from '@/components/SoreDetails';
import { User, Sore } from '@/types';
import BarChartComponent from '@/components/charts/BarChartComponent';

export const MySoresLayout = ({
  user,
  soresData
}: {
  user: User;
  soresData: Sore[];
}) => {
  return (
    <SoreProvider initialSores={soresData}>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto gap-x-20 md:px-10 px-0">
          <div className="flex max-w-lg justify-between">
            <ImagePoint user={user} />
          </div>
          <div>
            <SoreDetails />
            <BarChartComponent sores={soresData} />
          </div>
        </div>
      </div>
    </SoreProvider>
  );
};

export default MySoresLayout;
