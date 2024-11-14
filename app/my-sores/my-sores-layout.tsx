'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ImagePoint from '@/components/image-plot/ImagePoint';

export const MySoresLayout = () => {
  const [mode, setMode] = useState<'add' | 'edit' | 'update' | 'view'>('view');
  return (
    <div>
      <h1>Welcome to MySoresLayout!</h1>
      <ImagePoint mode={mode} setMode={setMode} />
      <div className="flex gap-2 mt-4">
        <Button onClick={() => setMode('view')}>View</Button>
        <Button onClick={() => setMode('add')}>Add</Button>
        <Button onClick={() => setMode('edit')}>Edit</Button>
        <Button onClick={() => setMode('update')}>Update</Button>
      </div>
    </div>
  );
};

export default MySoresLayout;
