'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ImagePoint from '@/components/image-plot/ImagePoint';
import SoreSliders from '@/components/image-plot/SoreSliders';
import type { Sore } from '@/types';
import { SoreProvider } from '@/context/SoreContext';

export const MySoresLayout = () => {
  const [mode, setMode] = useState<'add' | 'edit' | 'update' | 'view'>('view');

  return (
    <SoreProvider>
      <div>
        <h1>My Sores</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <ImagePoint mode={mode} setMode={setMode} />
          </div>
          <div>
            {mode !== 'view' && <SoreSliders />}

          </div>
        </div>
      </div>
    </SoreProvider>
  );
};

export default MySoresLayout;
