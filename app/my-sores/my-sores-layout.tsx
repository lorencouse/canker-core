'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ImagePoint from '@/components/image-plot/ImagePoint';
import SoreSliders from '@/components/image-plot/SoreSliders';
import type { Sore } from '@/types';
import { SoreProvider } from '@/context/SoreContext';
import { SoreDetails } from '@/components/SoreDetails';

export const MySoresLayout = () => {
  return (
    <SoreProvider>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto gap-x-20 md:px-10 px-0">
          <div className="flex max-w-lg justify-between">
            <ImagePoint />
          </div>
          <div>
            <SoreSliders />
            <SoreDetails />
          </div>
        </div>
      </div>
    </SoreProvider>
  );
};

export default MySoresLayout;
