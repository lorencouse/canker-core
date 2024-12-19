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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
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
